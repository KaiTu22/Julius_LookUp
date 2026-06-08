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

  try {
    let results = [];

    // If term starts with @, search by handle
    let juliusRawData = null;
    if (term.startsWith("@")) {
      const handleQuery = term.substring(1);
      if (handleQuery.length >= 2) {
        const ts = Math.floor(Date.now() / 1000);
        const handleRes = await juliusFetch(
          `/influencers/export/social?platform=instagram&handle=${encodeURIComponent(handleQuery)}&ts=${ts}`,
          "GET",
          null,
          apiKey,
          apiSecret
        );

        if (handleRes.ok) {
          const responseData = await handleRes.json();
          juliusRawData = responseData;
          // Julius returns results array
          const influencer = Array.isArray(responseData.results) ? responseData.results[0] : responseData;
          if (!influencer) {
            // No result found
          } else {
            // Use slug to fetch full data from archive
            const slug = influencer.slug || influencer.id;
            if (slug && sql) {
              try {
                const archiveRows = await sql`
                  SELECT
                    id,
                    slug,
                    display_name,
                    (raw_data->'avatar'->>'url') AS avatar_url,
                    (raw_data->>'tagline') AS tagline,
                    total_followers
                  FROM influencers
                  WHERE slug = ${slug}
                `;
                if (archiveRows.length > 0) {
                  const r = archiveRows[0];
                  results = [{
                    id: r.id,
                    slug: r.slug,
                    display_name: r.display_name,
                    avatar: r.avatar_url ? { url: r.avatar_url } : {},
                    tagline: r.tagline,
                    social_total_count: r.total_followers,
                    type: "influencer",
                  }];
                } else {
                  // Not in archive yet, return full Julius data
                  results = [{
                    id: influencer.id,
                    slug: influencer.slug,
                    display_name: influencer.display_name,
                    avatar: influencer.avatar || {},
                    tagline: influencer.tagline,
                    social_total_count: influencer.social_total_count,
                    type: "influencer",
                  }];
                }
              } catch (err) {
                console.error("Handle search archive lookup failed:", err.message);
                results = [{
                  id: influencer.id,
                  slug: influencer.slug,
                  display_name: influencer.display_name,
                  avatar: influencer.avatar || {},
                  tagline: influencer.tagline,
                  social_total_count: influencer.social_total_count,
                  type: "influencer",
                }];
              }
            } else {
              // No sql, return Julius data as-is
              results = [{
                id: influencer.id,
                slug: influencer.slug,
                display_name: influencer.display_name,
                avatar: influencer.avatar || {},
                tagline: influencer.tagline,
                social_total_count: influencer.social_total_count,
                type: "influencer",
              }];
            }
          }
        }
      }
    } else {
      // Use Julius typeahead for name search
      const ts = Math.floor(Date.now() / 1000);
      const typeaheadRes = await juliusFetch(
        `/influencers/search/typeahead?ts=${ts}&term=${encodeURIComponent(term)}`,
        "GET",
        null,
        apiKey,
        apiSecret
      );

      if (!typeaheadRes.ok) {
        const text = await typeaheadRes.text();
        console.error("Julius typeahead failed:", { status: typeaheadRes.status, detail: text });
        return res.status(typeaheadRes.status).json({
          error: `Julius typeahead failed (HTTP ${typeaheadRes.status})`,
          detail: text,
        });
      }

      const data = await typeaheadRes.json();
      results = Array.isArray(data) ? data : data.results || [];
    }

    // Enrich with local database data (follower counts, tagline)
    if (results.length > 0 && sql) {
      try {
        const slugs = results.map(r => r.slug).filter(Boolean);
        const archiveData = await sql`
          SELECT slug, total_followers, tagline
          FROM influencers
          WHERE slug = ANY(${slugs})
        `;

        const archiveMap = Object.fromEntries(
          archiveData.map(r => [r.slug, r])
        );

        results = results.map(r => ({
          ...r,
          social_total_count: archiveMap[r.slug]?.total_followers || null,
          tagline: archiveMap[r.slug]?.tagline || r.tagline,
        }));
      } catch (err) {
        console.warn("Failed to enrich from archive:", err.message);
      }
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      results,
      _debug: {
        term,
        isHandle: term.startsWith("@"),
        juliusRawData
      }
    });
  } catch (err) {
    console.error("Typeahead error:", err);
    return res.status(500).json({
      error: "Failed to search influencers",
      detail: err.message,
    });
  }
}
