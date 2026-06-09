import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const { handle } = req.query;

  if (!handle || handle.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase();
    const results = [];

    // Search local archive for matching social handles
    if (sql) {
      try {
        const rows = await sql`
          SELECT
            id,
            slug,
            display_name,
            (raw_data->'avatar'->>'url') AS avatar_url,
            (raw_data->>'tagline') AS tagline,
            total_followers,
            raw_data
          FROM influencers
          WHERE
            raw_data::text ILIKE ${'%' + cleanHandle + '%'}
          ORDER BY total_followers DESC NULLS LAST
          LIMIT 20
        `;

        for (const row of rows) {
          try {
            const rawData = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
            const socialCombined = rawData?.social_combined || [];

            // Find matching handles and platforms
            for (const platform of socialCombined) {
              const accounts = platform.accounts || [];
              for (const account of accounts) {
                const remoteHandle = (account.remote_handle || "").toLowerCase();
                if (remoteHandle.includes(cleanHandle)) {
                  const platformName = platform.platform || 'unknown';
                  const accountUrl = account.url || `https://${platformName}.com/${remoteHandle}`;

                  results.push({
                    id: row.id,
                    slug: row.slug,
                    display_name: row.display_name,
                    avatar: row.avatar_url ? { url: row.avatar_url } : {},
                    tagline: row.tagline,
                    social_total_count: row.total_followers,
                    platform: platformName,
                    platformUrl: accountUrl,
                    type: "influencer",
                  });
                }
              }
            }
          } catch (err) {
            console.error("Error parsing raw_data:", err);
          }
        }

        // Deduplicate by slug (in case same influencer has multiple matching handles)
        const deduped = Array.from(
          new Map(results.map(r => [r.slug, r])).values()
        );

        res.setHeader("Content-Type", "application/json");
        return res.status(200).json({ results: deduped });
      } catch (err) {
        console.error("Archive search error:", err);
        return res.status(200).json({ results: [] });
      }
    } else {
      return res.status(200).json({ results: [] });
    }
  } catch (err) {
    console.error("Handle typeahead error:", err);
    return res.status(200).json({ results: [] });
  }
}
