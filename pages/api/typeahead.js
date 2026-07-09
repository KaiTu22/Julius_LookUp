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

    // If term starts with @, search by handle across multiple platforms
    if (term.startsWith("@")) {
      const handleQuery = term.substring(1);
      if (handleQuery.length >= 2) {
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

        const seenSlugs = new Set();
        const ts = Math.floor(Date.now() / 1000);

        // Search each platform in parallel
        const platformResults = await Promise.all(
          platforms.map(async (platform) => {
            try {
              const handleRes = await juliusFetch(
                `/influencers/export/social?platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(handleQuery)}&ts=${ts}`,
                "GET",
                null,
                apiKey,
                apiSecret
              );

              if (!handleRes.ok) return null;

              const responseData = await handleRes.json();
              const influencer = Array.isArray(responseData.results)
                ? responseData.results[0]
                : responseData;

              if (!influencer || !influencer.id) return null;

              return { influencer, platform };
            } catch (err) {
              console.error(`Handle search on ${platform} failed:`, err.message);
              return null;
            }
          })
        );

        // Process handle results
        for (const result of platformResults) {
          if (!result) continue;

          const { influencer, platform } = result;
          const slug = influencer.slug || influencer.id;

          // Skip duplicates
          if (seenSlugs.has(slug)) continue;
          seenSlugs.add(slug);

          // Get platform-specific URL
          let accountUrl = influencer.social_combined
            ?.find((s) => s.platform?.toLowerCase() === platform.toLowerCase())
            ?.accounts?.[0]?.url;

          if (!accountUrl) {
            accountUrl = `https://juliusworks.com/${slug}`;
          }

          // Try to enrich with archive data
          let archiveData = null;
          if (sql) {
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
                LIMIT 1
              `;
              archiveData = archiveRows[0];
            } catch (err) {
              console.error(`Archive lookup failed for ${slug}:`, err.message);
            }
          }

          results.push({
            id: influencer.id,
            slug: slug,
            display_name: influencer.display_name,
            avatar: influencer.avatar || (archiveData?.avatar_url ? { url: archiveData.avatar_url } : {}),
            tagline: archiveData?.tagline || influencer.tagline,
            social_total_count: archiveData?.total_followers || influencer.social_total_count,
            accountUrl,
            type: "influencer",
            searchType: "handle", // Mark as handle match
          });
        }

        // If handle search returns sparse results, fall back to name search
        if (results.length < 5) {
          try {
            const nameQuery = handleQuery; // Search by the name part without @
            const ts2 = Math.floor(Date.now() / 1000);
            const nameRes = await juliusFetch(
              `/influencers/search/typeahead?ts=${ts2}&term=${encodeURIComponent(nameQuery)}`,
              "GET",
              null,
              apiKey,
              apiSecret
            );

            if (nameRes.ok) {
              const nameData = await nameRes.json();
              const nameResults = Array.isArray(nameData) ? nameData : nameData.results || [];

              // Add name results, avoiding duplicates
              for (const influencer of nameResults) {
                const slug = influencer.slug || influencer.id;
                if (seenSlugs.has(slug)) continue; // Skip already included
                seenSlugs.add(slug);

                results.push({
                  ...influencer,
                  searchType: "name", // Mark as name match (fallback)
                });
              }
            }
          } catch (err) {
            console.error("Name fallback search failed:", err.message);
          }
        }

        // Sort by type first (handle before name), then by followers
        results.sort((a, b) => {
          if (a.searchType === "handle" && b.searchType === "name") return -1;
          if (a.searchType === "name" && b.searchType === "handle") return 1;
          return (b.social_total_count || 0) - (a.social_total_count || 0);
        });
      }
    } else {
      // Use Julius typeahead for name search (exact matches)
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

      // Sort results by relevance: exact match first, then prefix matches, then others
      const searchTermLower = term.toLowerCase();
      results.sort((a, b) => {
        const aName = (a.display_name || "").toLowerCase();
        const bName = (b.display_name || "").toLowerCase();

        // Exact match comes first
        const aExact = aName === searchTermLower ? 0 : 1;
        const bExact = bName === searchTermLower ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;

        // Then prefix matches (starts with search term)
        const aPrefix = aName.startsWith(searchTermLower) ? 0 : 1;
        const bPrefix = bName.startsWith(searchTermLower) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;

        // Finally, sort by follower count
        return (b.social_total_count || 0) - (a.social_total_count || 0);
      });

      // Add fuzzy matches from archive if exact results are sparse
      if (sql && results.length < 5) {
        try {
          const searchTerm = term.toLowerCase();
          const fuzzyResults = await sql`
            SELECT
              id,
              slug,
              display_name,
              (raw_data->'avatar'->>'url') AS avatar_url,
              (raw_data->>'tagline') AS tagline,
              total_followers
            FROM influencers
            WHERE LOWER(display_name) ILIKE ${`%${searchTerm}%`}
            AND slug NOT IN (${results.map(r => r.slug).filter(Boolean)})
            ORDER BY total_followers DESC NULLS LAST
            LIMIT ${10 - results.length}
          `;

          // Add fuzzy results
          for (const row of fuzzyResults) {
            results.push({
              id: row.id,
              slug: row.slug,
              display_name: row.display_name,
              avatar: row.avatar_url ? { url: row.avatar_url } : {},
              tagline: row.tagline,
              social_total_count: row.total_followers,
              type: "influencer",
              fuzzy: true, // Mark as fuzzy match
            });
          }

          // Re-sort after adding fuzzy results to maintain relevance order
          const searchTermLower = term.toLowerCase();
          results.sort((a, b) => {
            // Exact matches come first
            const aName = (a.display_name || "").toLowerCase();
            const bName = (b.display_name || "").toLowerCase();
            const aExact = aName === searchTermLower ? 0 : 1;
            const bExact = bName === searchTermLower ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;

            // Then prefix matches
            const aPrefix = aName.startsWith(searchTermLower) ? 0 : 1;
            const bPrefix = bName.startsWith(searchTermLower) ? 0 : 1;
            if (aPrefix !== bPrefix) return aPrefix - bPrefix;

            // Then exact results before fuzzy results
            if (a.fuzzy !== b.fuzzy) return (a.fuzzy ? 1 : 0) - (b.fuzzy ? 1 : 0);

            // Finally, by follower count
            return (b.social_total_count || 0) - (a.social_total_count || 0);
          });
        } catch (err) {
          console.warn("Fuzzy search failed:", err.message);
        }
      }
    }

    // Enrich exact matches with local database data
    if (results.length > 0 && sql) {
      try {
        const exactResults = results.filter(r => !r.fuzzy);
        const slugs = exactResults.map(r => r.slug).filter(Boolean);

        if (slugs.length > 0) {
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
            social_total_count: r.fuzzy ? r.social_total_count : (archiveMap[r.slug]?.total_followers || null),
            tagline: r.fuzzy ? r.tagline : (archiveMap[r.slug]?.tagline || r.tagline),
          }));
        }
      } catch (err) {
        console.warn("Failed to enrich from archive:", err.message);
      }
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ results });
  } catch (err) {
    console.error("Typeahead error:", err);
    return res.status(500).json({
      error: "Failed to search influencers",
      detail: err.message,
    });
  }
}
