import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const { id, slug } = req.query;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed." });

  try {
    const result = await sql`
      DELETE FROM list_members
      WHERE list_id = ${id} AND influencer_slug = ${slug}
      RETURNING list_id
    `;
    if (result.length === 0) return res.status(404).json({ error: "Member not found." });
    return res.status(200).json({ removed: { list_id: id, influencer_slug: slug } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
