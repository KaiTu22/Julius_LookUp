import { sql } from "@/lib/db";

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === "GET") {
      const [list] = await sql`SELECT * FROM lists WHERE id = ${id}`;
      if (!list) return res.status(404).json({ error: "List not found." });
      const members = await sql`
        SELECT
          lm.influencer_slug                AS slug,
          lm.notes,
          lm.added_at,
          i.display_name,
          i.total_followers,
          (i.raw_data->'avatar'->>'url')    AS avatar_url,
          (i.raw_data->>'tagline')          AS tagline
        FROM list_members lm
        JOIN influencers i ON i.slug = lm.influencer_slug
        WHERE lm.list_id = ${id}
        ORDER BY lm.added_at DESC
      `;
      return res.status(200).json({ list, members });
    }

    if (req.method === "DELETE") {
      const result = await sql`DELETE FROM lists WHERE id = ${id} RETURNING id`;
      if (result.length === 0) return res.status(404).json({ error: "List not found." });
      return res.status(200).json({ deleted: id });
    }

    if (req.method === "PATCH") {
      const { name, description } = req.body || {};
      const [row] = await sql`
        UPDATE lists
        SET name        = COALESCE(${name?.trim() || null}, name),
            description = COALESCE(${description?.trim() || null}, description),
            updated_at  = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: "List not found." });
      return res.status(200).json({ list: row });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
