import { sql } from "@/lib/db";

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  try {
    if (req.method === "GET") {
      // Get all root folders (depth=1) with counts
      const folders = await sql`
        SELECT
          f.id,
          f.name,
          f.description,
          f.depth,
          f.display_order,
          f.created_at,
          f.updated_at,
          COUNT(DISTINCT l.id) as list_count,
          COUNT(DISTINCT fc.id) as subfolder_count
        FROM folders f
        LEFT JOIN lists l ON l.folder_id = f.id
        LEFT JOIN folders fc ON fc.parent_id = f.id
        WHERE f.parent_id IS NULL
        GROUP BY f.id
        ORDER BY f.display_order, f.created_at
      `;

      return res.status(200).json({ folders });
    }

    if (req.method === "POST") {
      const { name, description, parent_id } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Folder name is required" });
      }

      // Validate parent exists and check depth
      let newDepth = 1;
      if (parent_id) {
        const [parent] = await sql`
          SELECT depth FROM folders WHERE id = ${parent_id}
        `;

        if (!parent) {
          return res.status(404).json({ error: "Parent folder not found" });
        }

        if (parent.depth >= 4) {
          return res.status(400).json({
            error: "Cannot create folder: maximum nesting level (4) reached",
          });
        }

        newDepth = parent.depth + 1;
      }

      // Create folder
      const [folder] = await sql`
        INSERT INTO folders (parent_id, name, description, depth)
        VALUES (${parent_id || null}, ${name.trim()}, ${description || null}, ${newDepth})
        RETURNING *
      `;

      // Insert closure table entries
      if (parent_id) {
        // Get all ancestors of parent
        const ancestors = await sql`
          SELECT ancestor_id, depth FROM folder_ancestors
          WHERE descendant_id = ${parent_id}
          UNION ALL
          SELECT ${parent_id}, 0
        `;

        // Insert ancestor relationships for new folder
        for (const ancestor of ancestors) {
          await sql`
            INSERT INTO folder_ancestors (descendant_id, ancestor_id, depth)
            VALUES (${folder.id}, ${ancestor.ancestor_id}, ${ancestor.depth + 1})
          `;
        }
      }

      return res.status(201).json({ folder });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Folder API error:", err);
    res.status(500).json({ error: err.message });
  }
}
