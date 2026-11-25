// Vercel serverless endpoint: /api/chat
export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };
// Proxies chat requests to the SYNORA Cloudflare Workers AI endpoint.
// Configure SYNORA_AI_URL in Vercel Environment Variables.
// Keep the Worker URL on the server; do not call it from public browser code.

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_MESSAGES = 12;
const MAX_CHARS_PER_MESSAGE = 5000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return res.status(403).json({ error: "Request origin not allowed." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }

  const workerUrl = process.env.SYNORA_AI_URL || "https://synora-chat-ai.dbil0368.workers.dev/";

  let parsedUrl;
  try {
    parsedUrl = new URL(workerUrl);
    if (parsedUrl.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return res.status(503).json({ error: "SYNORA_AI_URL must be a valid HTTPS URL." });
  }

  let raw;
  try {
    raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request." });
  }

  if (!raw || !Array.isArray(raw.messages) ||
      raw.messages.length < 1 || raw.messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "Send between 1 and 12 chat messages." });
  }

  const messages = [];
  for (const item of raw.messages) {
    if (!item || !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" || item.content.trim().length < 1 ||
        item.content.length > MAX_CHARS_PER_MESSAGE) {
      return res.status(400).json({ error: "A message is invalid or too long." });
    }
    messages.push({ role: item.role, content: item.content });
  }

  const image = typeof raw.image === "string" ? raw.image : "";
  if (image && (!/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 3.7 * 1024 * 1024)) {
    return res.status(400).json({ error: "Image must be JPG, PNG or WEBP and no larger than 3 MB." });
  }
  if (image) {
    const lastUser = [...messages].reverse().find(item => item.role === "user");
    if (!lastUser) return res.status(400).json({ error: "Send a text message with your image." });
    lastUser.content = [
      { type: "text", text: lastUser.content },
      { type: "image_url", image_url: { url: image, detail: "auto" } }
    ];
  }

  // Keep the assistant's identity and language behaviour consistent on every turn.
  // The system instruction is added server-side so visitors cannot override it from the browser.
  const systemInstruction = [
    "You are SYNORA AI, the official multilingual assistant of the SYNORA platform.",
    "Never identify yourself as AllToolsHub AI or as another product. If asked your name, say: I am SYNORA AI.",
    "Reply in the same language as the user's latest message. If the user mixes languages, respond naturally in that mix. Use Bengali when the user writes Bengali.",
    "Be a capable general-purpose assistant. Handle everyday questions, explanations, tutoring, math, translation, writing, brainstorming, summaries, planning, coding, debugging, and step-by-step guidance. Adapt depth to the user's request and do not unnecessarily refuse ordinary helpful tasks.",
    "Follow the user's actual instruction closely. Do not replace a specific request with a generic suggestion, unrelated image, list of choices, or different task. If the request is clear, do it directly. Ask one short clarifying question only when a missing detail is essential.",
    "For image requests, do not output JSON, action names, tool syntax, hidden reasoning, pseudo tool calls, or pretend an image was generated. Never print an object containing keys such as action, action_input, or thought. Use the connected image-generation or image-editing feature when available. If that feature cannot perform the request, explain the limitation plainly in the user's language.",
    "Follow concise and misspelled everyday requests when their meaning is clear. Do not force the user to choose from a menu when they have already specified what they want. For edits, change only the requested part and preserve the rest of the supplied image.",
    "Do not claim that video, audio, file-reading, browsing, or other tools ran unless the corresponding connected feature actually returned a result. When a feature is unavailable, state that honestly and offer a useful text-based alternative.",
    "For image editing, when a source photo is attached, preserve the original subject and change only the elements the user asked to change. If no photo is attached and the user requests background replacement, ask them to attach the photo.",
    "Never reveal internal tool calls, API payloads, hidden reasoning, secrets, or implementation traces.",
    "For date and time questions, do not guess or invent dates or times. Use a verified live local clock/date when available; otherwise say you cannot verify the current local value.",

    "Be accurate, clear, and useful. Do not invent features, links, prices, deployments, or completed actions.",
    "When asked to build a website, app, or other project, give a concrete starter implementation or usable code when enough information is available; avoid generic lists of website builders. If a key requirement is missing, ask only the single most important question.",
    "Be honest about limitations: do not claim you have published, installed, generated, or tested something unless it actually happened.",
    "Use concise answers by default, with practical steps and code when helpful."
  ].join(" ");

  const upstreamMessages = [{ role: "system", content: systemInstruction }, ...messages];
  if (Buffer.byteLength(JSON.stringify({ messages: upstreamMessages }), "utf8") > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "The conversation is too large. Start a new chat." });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: upstreamMessages })
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || (payload && payload.success === false)) {
      const status = upstream.status === 429 ? 429 : 502;
      const workerMessage = typeof payload.error === "string" ? payload.error :
        (typeof payload.message === "string" ? payload.message : "");
      return res.status(status).json({
        error: "Worker response (HTTP " + upstream.status + ")" +
          (workerMessage ? ": " + workerMessage.slice(0, 220) : ". Check the Worker POST handler and model response format."),
        upstreamStatus: upstream.status
      });
    }

    // Accept both the SYNORA {success, reply} format and Cloudflare AI's
    // common {response} format, including the older Worker tasks array.
    let reply = "";
    if (payload && typeof payload.reply === "string") {
      reply = payload.reply;
    } else if (payload && typeof payload.response === "string") {
      reply = payload.response;
    } else if (payload && payload.result && typeof payload.result.response === "string") {
      reply = payload.result.response;
    } else if (Array.isArray(payload)) {
      const responses = payload
        .map(item => item && typeof item.response === "string" ? item.response.trim() : "")
        .filter(Boolean);
      reply = responses.length ? responses[responses.length - 1] : "";
    }

    if (!reply.trim()) {
      return res.status(502).json({
        error: "The Worker responded, but no text reply was found. Check the Worker POST response format."
      });
    }

    // Never expose model-generated pseudo tool calls or hidden-reasoning JSON to visitors.
    let cleanReply = reply.trim();
    if (/^\\s*\\{[\\s\\S]*\\}\\s*$/.test(cleanReply)) {
      try {
        const parsed = JSON.parse(cleanReply);
        if (parsed && typeof parsed === "object" &&
            (Object.prototype.hasOwnProperty.call(parsed, "action_input") ||
             Object.prototype.hasOwnProperty.call(parsed, "thought"))) {
          cleanReply = "আমি আপনার অনুরোধ বুঝেছি। এই কাজটি সম্পন্ন করতে SYNORA-র সংশ্লিষ্ট ফিচারটি ব্যবহার করতে হবে।";
        }
      } catch { /* Keep ordinary text that only resembles JSON. */ }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reply: cleanReply });
  } catch {
    return res.status(502).json({
      error: "Could not reach the SYNORA AI Worker. Check the Worker URL and try again."
    });
  }
}
