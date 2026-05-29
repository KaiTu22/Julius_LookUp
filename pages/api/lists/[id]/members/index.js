import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const { influencer_slug, notes } = req.body || {};
    if (!influencer_slug) return res.status(400).json({ error: "influencer_slug is required." });

    const [inf] = await sql`SELECT slug FROM influencers WHERE slug = ${influencer_slug}`;
    if (!inf) {
      return res.status(404).json({
        error: `Influencer "${influencer_slug}" is not in the archive yet. Search them first to add them to the archive, then save to a list.`,
      });
    }

    await sql`
      INSERT INTO list_members (list_id, influencer_slug, notes)
      VALUES (${id}, ${influencer_slug}, ${notes || null})
      ON CONFLICT (list_id, influencer_slug) DO UPDATE SET notes = EXCLUDED.notes
    `;
    return res.status(201).json({ added: { list_id: id, influencer_slug } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
