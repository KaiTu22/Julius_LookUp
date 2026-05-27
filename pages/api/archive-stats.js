import { sql } from "@/lib/db";

export default async function handler(req, res) {
  try {
    const [counts] = await sql`
      SELECT
        COUNT(*)::int                            AS total_profiles,
        COALESCE(SUM(total_followers), 0)::bigint AS total_followers_archived,
        MAX(last_fetched_at)                     AS most_recent_archive
      FROM influencers
    `;

    const profiles = await sql`
      SELECT slug, display_name, total_followers, first_fetched_at, last_fetched_at
      FROM influencers
      ORDER BY last_fetched_at DESC
    `;

    return res.status(200).json({
      totalProfiles: counts.total_profiles,
      totalFollowersArchived: Number(counts.total_followers_archived),
      mostRecentArchive: counts.most_recent_archive,
      profiles,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
