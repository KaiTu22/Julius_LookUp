import crypto from "crypto";

const JULIUS_BASE_URL = "https://api.juliusworks.com";
const JULIUS_UA = "julius-api-client";

function generateSignature(method, fullUrl, secret) {
  const payload = `${method.toUpperCase()}|${fullUrl}|${JULIUS_UA}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

async function juliusFetch(path, method = "GET", body = null, apiKey, apiSecret) {
  const fullUrl = `${JULIUS_BASE_URL}${path}`;
  const sig = generateSignature(method, fullUrl, apiSecret);
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": JULIUS_UA,
      "X-API-Key": apiKey,
      "X-Signature": sig,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(fullUrl, opts);
}

export async function POST(req) {
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return Response.json(
      { error: "Julius credentials not configured." },
      { status: 500 }
    );
  }

  try {
    const { slugs } = await req.json();

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return Response.json({ error: "Slugs array is required" }, { status: 400 });
    }

    const ts = Math.floor(Date.now() / 1000);
    const bulkRes = await juliusFetch(
      `/influencers/export/bulk?ts=${ts}`,
      "POST",
      { ids: slugs },
      apiKey,
      apiSecret
    );

    if (!bulkRes.ok) {
      const text = await bulkRes.text();
      console.error("Julius bulk fetch failed:", { status: bulkRes.status, detail: text });
      return Response.json(
        { error: `Julius fetch failed (HTTP ${bulkRes.status})` },
        { status: bulkRes.status }
      );
    }

    const bulkData = await bulkRes.json();
    const influencers = Array.isArray(bulkData) ? bulkData : bulkData.results || [];

    const enriched = influencers.map(inf => ({
      id: inf.id,
      slug: inf.slug,
      display_name: inf.display_name,
      tagline: inf.tagline,
      avatar: inf.avatar,
      social_total_count: inf.social_total_count,
    }));

    return Response.json({ influencers: enriched }, { status: 200 });
  } catch (err) {
    console.error("Get influencer data error:", err);
    return Response.json(
      {
        error: "Failed to fetch influencer data",
        detail: err.message,
      },
      { status: 500 }
    );
  }
}
