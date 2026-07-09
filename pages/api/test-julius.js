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

export default async function handler(req, res) {
  try {
    const apiKey = process.env.JULIUS_API_KEY;
    const apiSecret = process.env.JULIUS_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: "Credentials not configured" });
    }

    const ts = Math.floor(Date.now() / 1000);
    const payload = {
      query: [
        {
          type: "reach",
          platform: "instagram",
          value: {
            max: 500000,
          },
        },
      ],
      sort: ["reach", "desc"],
    };

    console.log("Test payload:", JSON.stringify(payload, null, 2));

    const searchRes = await juliusFetch(
      `/influencers/search?ts=${ts}&limit=10&offset=0`,
      "POST",
      payload,
      apiKey,
      apiSecret
    );

    const data = await searchRes.json();
    console.log("Test response:", data);

    return res.status(200).json({
      status: searchRes.status,
      ok: searchRes.ok,
      results: data,
    });
  } catch (err) {
    console.error("Test error:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
}
