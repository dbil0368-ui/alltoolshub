import { timingSafeEqual } from "node:crypto";

export function requireApiKey(req, res) {
  const expected = process.env.SYNORA_API_KEY;
  if (!expected || expected.length < 32) {
    res.status(503).json({ error: "API authentication is not configured. Ask the project administrator to set SYNORA_API_KEY securely." });
    return false;
  }
  const header = req.headers.authorization || "";
  const match = /^Bearer ([A-Za-z0-9._~-]{32,256})$/.exec(header);
  if (!match) {
    res.setHeader("WWW-Authenticate", "Bearer");
    res.status(401).json({ error: "A valid Bearer API key is required." });
    return false;
  }
  const supplied = Buffer.from(match[1]);
  const known = Buffer.from(expected);
  if (supplied.length !== known.length || !timingSafeEqual(supplied, known)) {
    res.status(401).json({ error: "Invalid API key." });
    return false;
  }
  return true;
}

export function sameOriginIfBrowser(req, res) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return true;
  try {
    if (new URL(origin).host === host) return true;
  } catch {}
  res.status(403).json({ error: "Request origin not allowed." });
  return false;
}
