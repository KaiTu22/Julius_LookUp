import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export { sql };

export async function archiveInfluencer(slug, exportData) {
  if (!sql) return;

  try {
    const displayName    = exportData?.display_name ?? null;
    const tagline        = exportData?.tagline ?? null;
    const avatarUrl      = exportData?.avatar?.url ?? null;
    const totalFollowers = exportData?.social_total_count ?? null;

    await sql`
      INSERT INTO influencers
        (slug, display_name, tagline, avatar_url, total_followers, raw_data, first_fetched_at, last_fetched_at)
      VALUES
        (${slug}, ${displayName}, ${tagline}, ${avatarUrl}, ${totalFollowers}, ${exportData}, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        display_name    = EXCLUDED.display_name,
        tagline         = EXCLUDED.tagline,
        avatar_url      = EXCLUDED.avatar_url,
        total_followers = EXCLUDED.total_followers,
        raw_data        = EXCLUDED.raw_data,
        last_fetched_at = NOW()
    `;
  } catch (err) {
    console.warn(`Archive write failed for ${slug}:`, err.message);
  }
}
