import crypto from "crypto";
import { archiveInfluencer } from "@/lib/db";
import { getCached, invalidateCache } from "@/lib/cache";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: "Slug is required." });
  }

  try {
    // Fetch from Julius (using export endpoint)
    const ts = Math.floor(Date.now() / 1000);
    const juliusRes = await juliusFetch(
      `/influencers/${encodeURIComponent(slug)}/export?ts=${ts}`,
      "GET",
      null,
      apiKey,
      apiSecret
    );

    if (!juliusRes.ok) {
      throw new Error(`Julius API error: ${juliusRes.status}`);
    }

    const influencerData = await juliusRes.json();

    // Archive to database
    await archiveInfluencer(slug, influencerData);

    return res.status(200).json({
      success: true,
      slug,
      display_name: influencerData.display_name,
    });
  } catch (err) {
    console.error("Archive error:", err);
    return res.status(500).json({
      error: "Failed to archive influencer",
      detail: err.message,
    });
  }
}
