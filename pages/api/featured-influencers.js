import { sql } from "@/lib/db";

export default async function handler(req, res) {
  try {
    if (!sql) {
      return res.status(200).json({ influencers: [] });
    }

    // Get top 12 influencers by follower count from archive
    const rows = await sql`
      SELECT
        slug,
        display_name,
        tagline,
        avatar_url,
        total_followers
      FROM influencers
      WHERE avatar_url IS NOT NULL AND total_followers > 0
      ORDER BY total_followers DESC
      LIMIT 12
    `;

    const influencers = rows.map(r => ({
      id: r.slug,
      slug: r.slug,
      display_name: r.display_name,
      tagline: r.tagline,
      avatar: r.avatar_url ? { url: r.avatar_url } : null,
      social_total_count: r.total_followers,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
