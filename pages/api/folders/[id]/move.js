import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const { id } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { parent_id } = req.body;

  try {
    // Get current folder
    const [folder] = await sql`
      SELECT * FROM folders WHERE id = ${id}
    `;

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    // Validate parent exists (if provided)
    let newDepth = 1;
    if (parent_id) {
      const [parent] = await sql`
        SELECT depth FROM folders WHERE id = ${parent_id}
      `;

      if (!parent) {
        return res.status(404).json({ error: "Parent folder not found" });
      }

      // Validate max depth
      if (parent.depth >= 4) {
        return res.status(400).json({
          error: "Cannot move folder: destination is at maximum nesting level",
        });
      }

      newDepth = parent.depth + 1;

      // Check for circular reference
      if (id === parent_id) {
        return res.status(400).json({ error: "Cannot move folder into itself" });
      }

      const [isDescendant] = await sql`
        SELECT 1 FROM folder_ancestors
        WHERE ancestor_id = ${id} AND descendant_id = ${parent_id}
      `;

      if (isDescendant) {
        return res.status(400).json({
          error: "Cannot move folder into its descendant",
        });
      }
    }

    // Update folder parent and depth
    const [updated] = await sql`
      UPDATE folders
      SET parent_id = ${parent_id || null}, depth = ${newDepth}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Update closure table for moved folder and all descendants
    // First, delete old ancestor relationships for this folder and descendants
    await sql`
      DELETE FROM folder_ancestors
      WHERE descendant_id IN (
        SELECT descendant_id FROM folder_ancestors
        WHERE ancestor_id = ${id}
      )
      OR descendant_id = ${id}
    `;

    // Re-insert closure table entries
    if (parent_id) {
      // Get all ancestors of new parent
      const ancestors = await sql`
        SELECT ancestor_id, depth FROM folder_ancestors
        WHERE descendant_id = ${parent_id}
        UNION ALL
        SELECT ${parent_id}, 0
      `;

      // Insert for the moved folder itself
      for (const ancestor of ancestors) {
        await sql`
          INSERT INTO folder_ancestors (descendant_id, ancestor_id, depth)
          VALUES (${id}, ${ancestor.ancestor_id}, ${ancestor.depth + 1})
        `;
      }
    }

    // Get all descendants of moved folder
    const descendants = await sql`
      SELECT id FROM folders
      WHERE parent_id = ${id}
      OR id IN (
        SELECT descendant_id FROM folder_ancestors
        WHERE ancestor_id = ${id}
      )
    `;

    // Rebuild ancestor relationships for descendants
    for (const desc of descendants) {
      // Get direct parent of descendant
      const [parent] = await sql`
        SELECT parent_id FROM folders WHERE id = ${desc.id}
      `;

      if (parent?.parent_id) {
        const ancestors = await sql`
          SELECT ancestor_id, depth FROM folder_ancestors
          WHERE descendant_id = ${parent.parent_id}
          UNION ALL
          SELECT ${parent.parent_id}, 0
        `;

        for (const ancestor of ancestors) {
          await sql`
            INSERT INTO folder_ancestors (descendant_id, ancestor_id, depth)
            VALUES (${desc.id}, ${ancestor.ancestor_id}, ${ancestor.depth + 1})
          `;
        }
      }
    }

    return res.status(200).json({ folder: updated });
  } catch (err) {
    console.error("Folder move error:", err);
    res.status(500).json({ error: err.message });
  }
}
