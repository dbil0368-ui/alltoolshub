// Vercel serverless endpoint: /api/image-generate
// Uses the existing Cloudflare Workers AI credentials. Never expose the token in browser code.
export const config = { api: { bodyParser: { sizeLimit: "32kb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return res.status(403).json({ error: "Request origin not allowed." });
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({ error: "Image generation is not configured. Add the existing Cloudflare account ID and API token in Vercel Environment Variables." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request." });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 1800) {
    return res.status(400).json({ error: "Describe the image in 1–1800 characters." });
  }

  try {
    const upstream = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(accountId) +
        "/ai/run/@cf/black-forest-labs/flux-1-schnell",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, steps: 4 })
      }
    );

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || payload?.success === false) {
      const detail = Array.isArray(payload?.errors)
        ? payload.errors.map(item => item?.message).filter(Boolean).join("; ")
        : "";
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: "Image service error" + (detail ? ": " + detail.slice(0, 220) : ". Check Cloudflare Workers AI access and usage limits.")
      });
    }

    const image = payload?.result?.image || payload?.image;
    if (typeof image !== "string" || !/^[A-Za-z0-9+/=]+$/.test(image)) {
      return res.status(502).json({ error: "The image service returned no valid image." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ image: "data:image/jpeg;base64," + image });
  } catch {
    return res.status(502).json({ error: "Could not reach Cloudflare Image AI. Please try again." });
  }
}
