import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA       = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
}

export default async function handler(req, res) {
  const apiKey    = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({
      error: "Julius credentials not configured. Add JULIUS_API_KEY and JULIUS_API_SECRET to .env.local.",
    });
  }

  const { mode, platform, handle, slug } = req.query;
  const ts = Math.floor(Date.now() / 1000);

  let juliusPath;
  let fetchMethod;
  let fetchBody = null;

  if (mode === "handle") {
    if (!platform || !handle) {
      return res.status(400).json({ error: "Handle lookups require both platform and handle parameters." });
    }
    const cleanHandle = handle.replace(/^@/, "");
    // POST with platform+handle in the body, ts in the query string
    juliusPath  = `/influencers/export?ts=${ts}`;
    fetchMethod = "POST";
    fetchBody   = { platform, handle: cleanHandle };

  } else if (mode === "slug") {
    if (!slug) {
      return res.status(400).json({ error: "Slug lookups require a slug parameter." });
    }
    juliusPath  = `/influencers/${encodeURIComponent(slug)}/export?ts=${ts}`;
    fetchMethod = "GET";

  } else {
    return res.status(400).json({ error: "Invalid mode. Use 'handle' or 'slug'." });
  }

  const fullUrl   = `${JULIUS_BASE_URL}${juliusPath}`;
  const signature = generateSignature(fetchMethod, fullUrl, apiSecret);

  let juliusRes;
  try {
    juliusRes = await fetch(fullUrl, {
      method: fetchMethod,
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   JULIUS_UA,
        "X-API-Key":    apiKey,
        "X-Signature":  signature,
      },
      body: fetchBody ? JSON.stringify(fetchBody) : undefined,
    });
  } catch (err) {
    console.error("[julius-proxy] Network error:", err);
    return res.status(502).json({ error: "Failed to reach Julius API.", detail: err.message });
  }

  res.setHeader("Content-Type", "application/json");
  res.status(juliusRes.status);
  const body = await juliusRes.text();
  res.send(body);
}
