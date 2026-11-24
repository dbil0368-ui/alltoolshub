// Vercel serverless endpoint: /api/image-edit
// Uses Cloudflare Workers AI FLUX.2 Klein for image-to-image editing.
// Required Vercel environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

const MAX_IMAGE_CHARS = 4 * 1024 * 1024;

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

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({
      error: "Image AI is not configured yet. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to Vercel Environment Variables."
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON request." });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const image = typeof body?.image === "string" ? body.image : "";
  if (!prompt || prompt.length > 1800) {
    return res.status(400).json({ error: "Describe the image edit in 1–1800 characters." });
  }
  const match = image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || image.length > MAX_IMAGE_CHARS) {
    return res.status(400).json({ error: "Choose a JPG, PNG or WEBP image under 3 MB." });
  }

  try {
    const imageBytes = Buffer.from(match[2], "base64");
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("input_image_0", new Blob([imageBytes], { type: "image/jpeg" }), "source.jpg");
    form.append("width", "1024");
    form.append("height", "1024");

    const upstream = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" +
        encodeURIComponent(accountId) +
        "/ai/run/@cf/black-forest-labs/flux-2-klein-4b",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + apiToken },
        body: form
      }
    );

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || payload.success === false) {
      const detail = Array.isArray(payload.errors)
        ? payload.errors.map(item => item.message).filter(Boolean).join("; ")
        : "";
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: "Cloudflare Image AI error" + (detail ? ": " + detail.slice(0, 240) : ". Check your Workers AI access and billing.")
      });
    }

    const base64Image = payload?.result?.image;
    if (typeof base64Image !== "string" || !base64Image.length) {
      return res.status(502).json({ error: "Cloudflare returned no image data." });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ image: "data:image/png;base64," + base64Image });
  } catch {
    return res.status(502).json({ error: "Could not reach Cloudflare Image AI. Please try again." });
  }
}
