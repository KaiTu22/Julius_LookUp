import crypto from "crypto";
import { sql } from "@/lib/db";

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
  const apiKey = process.env.JULIUS_API_KEY;
  const apiSecret = process.env.JULIUS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Julius credentials not configured." });
  }

  const term = req.query.term || "";

  if (!term.trim()) {
    return res.status(400).json({ error: "Search term is required." });
  }

  const lowerTerm = term.toLowerCase();
  let results = [];

  // Search archive first (fast)
  if (sql) {
    try {
      const archiveRows = await sql`
        SELECT slug, display_name, tagline, avatar_url, total_followers
        FROM influencers
        WHERE LOWER(display_name) LIKE ${`%${lowerTerm}%`}
        ORDER BY total_followers DESC
        LIMIT 10
      `;
      results = archiveRows.map(r => ({
        id: r.slug,
        slug: r.slug,
        display_name: r.display_name,
        tagline: r.tagline,
        avatar: r.avatar_url ? { url: r.avatar_url } : null,
        social_total_count: r.total_followers,
        _source: "archive",
      }));
    } catch (err) {
      console.warn("Archive search failed:", err.message);
    }
  }

  // Search Julius API
  try {
    const ts = Math.floor(Date.now() / 1000);
    const typeaheadRes = await juliusFetch(
      `/influencers/search/typeahead?ts=${ts}&term=${encodeURIComponent(term)}`,
      "GET",
      null,
      apiKey,
      apiSecret
    );

    if (typeaheadRes.ok) {
      const data = await typeaheadRes.json();
      const apiResults = Array.isArray(data) ? data : data.results || [];

      // Filter out any that are already in archive results
      const archiveSlugs = new Set(results.map(r => r.slug));
      const apiOnly = apiResults
        .filter(r => !archiveSlugs.has(r.slug))
        .map(r => ({
          ...r,
          _source: "api",
        }));

      results = [...results, ...apiOnly];
    }
  } catch (err) {
    console.error("Julius typeahead failed:", err.message);
  }

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({ results: results.slice(0, 15) });
}
