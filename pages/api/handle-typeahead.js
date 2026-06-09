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

  const { handle } = req.query;

  if (!handle || handle.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const cleanHandle = handle.replace(/^@/, "");
    const results = [];
    const seenSlugs = new Set();

    // List of platforms to search
    const platforms = [
      "instagram",
      "tiktok",
      "twitter",
      "youtube",
      "facebook",
      "twitch",
      "snapchat",
      "pinterest",
      "linkedin",
      "threads",
    ];

    // Search each platform for the handle
    const searchPromises = platforms.map(async (platform) => {
      try {
        const ts = Math.floor(Date.now() / 1000);
        const handleRes = await juliusFetch(
          `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(cleanHandle)}&ts=${ts}`,
          "GET",
          null,
          apiKey,
          apiSecret
        );

        console.log(`[handle-typeahead] ${platform}: HTTP ${handleRes.status}`);

        if (!handleRes.ok) {
          const text = await handleRes.text();
          console.log(`[handle-typeahead] ${platform} error response:`, text.substring(0, 200));
          return null;
        }

        const responseData = await handleRes.json();
        console.log(`[handle-typeahead] ${platform} data:`, JSON.stringify(responseData).substring(0, 200));

        const influencer = Array.isArray(responseData.results)
          ? responseData.results[0]
          : responseData;

        if (influencer && influencer.slug) {
          console.log(`[handle-typeahead] ${platform}: Found ${influencer.display_name} (${influencer.slug})`);
          return { influencer, platform };
        }
        return null;
      } catch (err) {
        console.error(`Error searching ${platform}:`, err.message);
        return null;
      }
    });

    const platformResults = await Promise.all(searchPromises);

    // Process results and deduplicate by slug
    for (const result of platformResults) {
      if (!result) continue;

      const { influencer, platform } = result;
      const slug = influencer.slug;

      // Skip if we've already added this influencer
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      // Find the account URL for this platform
      let platformUrl = null;
      const socialCombined = influencer.social_combined || [];
      const platformData = socialCombined.find(
        (s) => s.platform?.toLowerCase() === platform.toLowerCase()
      );
      if (platformData?.accounts?.[0]?.url) {
        platformUrl = platformData.accounts[0].url;
      }

      // Fallback URL construction
      if (!platformUrl) {
        platformUrl = `https://${platform}.com/${cleanHandle}`;
      }

      // Try to get additional data from archive
      let archiveData = null;
      if (sql) {
        try {
          const rows = await sql`
            SELECT total_followers, tagline, (raw_data->'avatar'->>'url') AS avatar_url
            FROM influencers
            WHERE slug = ${slug}
            LIMIT 1
          `;
          archiveData = rows[0];
        } catch (err) {
          console.error(`Error fetching archive data for ${slug}:`, err.message);
        }
      }

      results.push({
        id: influencer.id,
        slug: slug,
        display_name: influencer.display_name,
        avatar: influencer.avatar || (archiveData?.avatar_url ? { url: archiveData.avatar_url } : {}),
        tagline: archiveData?.tagline || influencer.tagline,
        social_total_count: archiveData?.total_followers || influencer.social_total_count,
        platform: platform,
        platformUrl: platformUrl,
        type: "influencer",
      });
    }

    // Sort by followers descending
    results.sort((a, b) => (b.social_total_count || 0) - (a.social_total_count || 0));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results: results.slice(0, 20) });
  } catch (err) {
    console.error("Handle typeahead error:", err);
    return res.status(200).json({ results: [] });
  }
}
