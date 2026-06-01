import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 6, 24);
  try {
    const rows = await sql`
      SELECT
        slug,
        display_name,
        total_followers,
        (raw_data->'avatar'->>'url') AS avatar_url,
        (raw_data->>'tagline')       AS tagline
      FROM influencers
      WHERE display_name IS NOT NULL
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    return res.status(200).json({ results: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
