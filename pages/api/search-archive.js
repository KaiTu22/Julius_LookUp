import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const q = (req.query.q || "").trim();
  if (q.length < 2) {
    return res.status(200).json({ results: [], query: q });
  }

  try {
    let rows;

    // If query starts with @, search by handle/slug; otherwise search by name
    if (q.startsWith('@')) {
      const handleQuery = q.substring(1); // Remove @
      rows = await sql`
        SELECT
          slug,
          display_name,
          total_followers,
          (raw_data->'avatar'->>'url') AS avatar_url,
          (raw_data->>'tagline')       AS tagline
        FROM influencers
        WHERE LOWER(slug) LIKE LOWER(${'%' + handleQuery + '%'})
        ORDER BY total_followers DESC NULLS LAST
        LIMIT 10
      `;
    } else {
      // Search by display name
      rows = await sql`
        SELECT
          slug,
          display_name,
          total_followers,
          (raw_data->'avatar'->>'url') AS avatar_url,
          (raw_data->>'tagline')       AS tagline
        FROM influencers
        WHERE LOWER(display_name) LIKE LOWER(${'%' + q + '%'})
        ORDER BY total_followers DESC NULLS LAST
        LIMIT 10
      `;
    }

    return res.status(200).json({ results: rows, query: q });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
