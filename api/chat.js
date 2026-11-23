// Vercel serverless endpoint: /api/chat
// Keep OPENROUTER_API_KEY in Vercel Project Settings > Environment Variables.
// Never put the key in index.html or any public JavaScript file.
const MAX_BODY_BYTES = 18000;
const MAX_MESSAGES = 12;
const MAX_MEMORY_CHARS = 4000;
const MAX_CHARS_PER_MESSAGE = 5000;
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed." }); }
  const origin = req.headers.origin, host = req.headers.host;
  if (origin && host) { try { if (new URL(origin).host !== host) return res.status(403).json({ error: "Request origin not allowed." }); } catch { return res.status(403).json({ error: "Invalid request origin." }); } }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not configured yet. The site owner must add OPENROUTER_API_KEY in the hosting dashboard." });
  let raw; try { raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: "Invalid JSON request." }); }
  if (!raw || !Array.isArray(raw.messages) || raw.messages.length < 1 || raw.messages.length > MAX_MESSAGES) return res.status(400).json({ error: "Send between 1 and 12 chat messages." });
  const memory = typeof raw.memory === "string" ? raw.memory.slice(0, MAX_MEMORY_CHARS) : "";
  const messages = [];
  for (const item of raw.messages) { if (!item || !["user","assistant"].includes(item.role) || typeof item.content !== "string" || item.content.length < 1 || item.content.length > MAX_CHARS_PER_MESSAGE) return res.status(400).json({ error: "A message is invalid or too long." }); messages.push({ role:item.role, content:item.content }); }
  if (Buffer.byteLength(JSON.stringify(messages),"utf8") > MAX_BODY_BYTES) return res.status(413).json({ error: "The conversation is too large. Start a new chat." });
  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", { method:"POST", headers:{ Authorization:"Bearer "+apiKey, "Content-Type":"application/json", "HTTP-Referer":"https://"+host, "X-Title":"SYNORA" }, body:JSON.stringify({ model:"openrouter/free", messages:[{role:"system",content:"You are AllToolsHub AI inside the AllToolsHub workspace and SYNORA ecosystem. Never claim to be Flint, Recursive, OpenAI, ChatGPT, or another company/model. If asked who made you, say the platform is maintained by the AllToolsHub team; do not invent a founder or owner. Reply in the user’s language. Maintain conversation continuity and interpret short replies like yes, ha, হ্যাঁ, ঠিক আছে using the preceding messages. Use supplied saved memory only when relevant; do not pretend to remember anything absent from chat or memory. Be clear, accurate, concise, friendly, and age-appropriate. Do not engage in romantic roleplay or claim romantic feelings. If unsure, say so. Do not claim actions you have not performed."+(memory ? "\n\nSaved user memory (this browser):\n"+memory : "")},...messages], temperature:0.5, max_tokens:900 }) });
    const payload = await upstream.json().catch(()=>({}));
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({ error: upstream.status === 429 ? "The free AI model is busy or its usage limit was reached. Please try again later." : "AI provider error: "+(payload?.error?.message || upstream.status) });
    const reply = payload?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return res.status(502).json({error:"The AI provider returned no text. Please try again."});
    res.setHeader("Cache-Control","no-store"); return res.status(200).json({reply:reply.trim()});
  } catch { return res.status(502).json({error:"Could not reach the AI provider. Please try again later."}); }
}