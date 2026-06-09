import { sql } from "@/lib/db";

export default async function handler(req, res) {
  try {
    if (!sql) {
      return res.status(500).json({ error: "Database not connected" });
    }

    // Get first 3 profiles and their handles
    const rows = await sql`
      SELECT
        slug,
        display_name,
        raw_data
      FROM influencers
      LIMIT 3
    `;

    const profiles = rows.map(row => {
      const rawData = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
      const handles = [];

      const socialCombined = rawData?.social_combined || [];
      for (const platform of socialCombined) {
        const accounts = platform.accounts || [];
        for (const account of accounts) {
          handles.push({
            platform: platform.platform,
            handle: account.remote_handle,
          });
        }
      }

      return {
        slug: row.slug,
        display_name: row.display_name,
        handles,
      };
    });

    res.status(200).json({
      count: rows.length,
      profiles,
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
}
