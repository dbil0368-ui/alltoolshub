import { requireApiKey, sameOriginIfBrowser } from "../../lib/api-auth.js";

const MAX_MESSAGES = 10;
const MAX_CHARS = 4000;
const DEFAULT_WORKER = "https://synora-chat-ai.dbil0368.workers.dev/";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!sameOriginIfBrowser(req, res)) return;
  if (!requireApiKey(req, res)) return;

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request." });
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "Send between 1 and 10 messages." });
  }
  const messages = [];
  for (const item of body.messages) {
    if (!item || !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" || !item.content.trim() || item.content.length > MAX_CHARS) {
      return res.status(400).json({ error: "Each message must have a valid role and 1–4000 characters." });
    }
    messages.push({ role: item.role, content: item.content.trim() });
  }
  if (Buffer.byteLength(JSON.stringify(messages), "utf8") > 48 * 1024) {
    return res.status(413).json({ error: "Request is too large." });
  }

  let workerUrl;
  try {
    workerUrl = new URL(process.env.SYNORA_AI_URL || DEFAULT_WORKER);
    if (workerUrl.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return res.status(503).json({ error: "The SYNORA AI backend URL is not configured correctly." });
  }

  const system = {
    role: "system",
    content: "You are SYNORA AI, a helpful multilingual assistant. Reply in the same language as the latest user message. Be accurate, safe and concise. Do not claim tools ran unless they did."
  };
  try {
    const upstream = await fetch(workerUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [system, ...messages] })
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || payload?.success === false) {
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: "SYNORA AI backend request failed.", upstreamStatus: upstream.status });
    }
    let reply = "";
    if (typeof payload.reply === "string") reply = payload.reply;
    else if (typeof payload.response === "string") reply = payload.response;
    else if (typeof payload?.result?.response === "string") reply = payload.result.response;
    else if (Array.isArray(payload)) {
      reply = payload.map(item => typeof item?.response === "string" ? item.response.trim() : "").filter(Boolean).pop() || "";
    }
    if (!reply.trim()) return res.status(502).json({ error: "The AI backend returned no text reply." });
    return res.status(200).json({ success: true, version: "v1", reply: reply.trim() });
  } catch {
    return res.status(502).json({ error: "Could not connect to the SYNORA AI backend." });
  }
}
