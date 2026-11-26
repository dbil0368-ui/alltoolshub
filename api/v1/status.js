export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const authConfigured = Boolean(process.env.SYNORA_API_KEY && process.env.SYNORA_API_KEY.length >= 32);
  return res.status(200).json({
    success: true,
    service: "SYNORA API",
    version: "v1",
    status: "online",
    authentication: authConfigured ? "configured" : "setup_required",
    chatBackend: process.env.SYNORA_AI_URL ? "custom_worker_configured" : "default_worker_configured",
    note: "Status endpoint is public. Chat requests require a Bearer API key."
  });
}
