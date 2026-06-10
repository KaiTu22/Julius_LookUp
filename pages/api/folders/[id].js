import { sql } from "@/lib/db";

async function validateCircularReference(folderId, newParentId) {
  if (folderId === newParentId) {
    throw new Error("Cannot move folder into itself");
  }

  if (!newParentId) return; // Moving to root is safe

  // Check if newParentId is a descendant of folderId
  const [isDescendant] = await sql`
    SELECT 1 FROM folder_ancestors
    WHERE ancestor_id = ${folderId} AND descendant_id = ${newParentId}
  `;

  if (isDescendant) {
    throw new Error("Cannot move folder into its descendant");
  }
}

export default async function handler(req, res) {
  if (!sql) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const { id } = req.query;

  try {
    if (req.method === "GET") {
      // Get folder with children (exclude soft-deleted)
      const [folder] = await sql`
        SELECT * FROM folders WHERE id = ${id} AND deleted_at IS NULL
      `;

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }

      // Get direct children (subfolders and lists)
      const subfolders = await sql`
        SELECT
          f.id,
          f.name,
          f.description,
          f.depth,
          f.display_order,
          'folder' as type,
          COUNT(DISTINCT fc.id) as subfolder_count,
          COUNT(DISTINCT l.id) as list_count
        FROM folders f
        LEFT JOIN folders fc ON fc.parent_id = f.id
        LEFT JOIN lists l ON l.folder_id = f.id
        WHERE f.parent_id = ${id}
        GROUP BY f.id
        ORDER BY f.display_order, f.created_at
      `;

      const lists = await sql`
        SELECT
          id,
          name,
          description,
          'list' as type,
          created_at
        FROM lists
        WHERE folder_id = ${id}
        ORDER BY created_at DESC
      `;

      const children = [...subfolders, ...lists];

      // Get breadcrumb path
      const breadcrumb = await sql`
        SELECT f.* FROM folders f
        JOIN folder_ancestors fa ON f.id = fa.ancestor_id
        WHERE fa.descendant_id = ${id}
        ORDER BY fa.depth ASC
      `;

      return res.status(200).json({ folder, children, breadcrumb });
    }

    if (req.method === "PATCH") {
      const { name, description, display_order } = req.body;

      let [updated];

      if (name !== undefined && description !== undefined && display_order !== undefined) {
        [updated] = await sql`
          UPDATE folders
          SET name = ${name}, description = ${description}, display_order = ${display_order}, updated_at = NOW()
          WHERE id = ${id} AND deleted_at IS NULL
          RETURNING *
        `;
      } else if (name !== undefined && description !== undefined) {
        [updated] = await sql`
          UPDATE folders
          SET name = ${name}, description = ${description}, updated_at = NOW()
          WHERE id = ${id} AND deleted_at IS NULL
          RETURNING *
        `;
      } else if (name !== undefined) {
        [updated] = await sql`
          UPDATE folders
          SET name = ${name}, updated_at = NOW()
          WHERE id = ${id} AND deleted_at IS NULL
          RETURNING *
        `;
      } else if (description !== undefined) {
        [updated] = await sql`
          UPDATE folders
          SET description = ${description}, updated_at = NOW()
          WHERE id = ${id} AND deleted_at IS NULL
          RETURNING *
        `;
      } else if (display_order !== undefined) {
        [updated] = await sql`
          UPDATE folders
          SET display_order = ${display_order}, updated_at = NOW()
          WHERE id = ${id} AND deleted_at IS NULL
          RETURNING *
        `;
      } else {
        return res.status(400).json({ error: "No fields to update" });
      }

      if (!updated) {
        return res.status(404).json({ error: "Folder not found" });
      }

      return res.status(200).json({ folder: updated });
    }

    if (req.method === "DELETE") {
      const [folder] = await sql`
        UPDATE folders
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING *
      `;

      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }

      return res.status(200).json({ message: "Folder deleted" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Folder API error:", err);
    res.status(500).json({ error: err.message });
  }
}
