"use client";
import { useState, useEffect } from "react";

const ACCENT = "#3b82f6";

function FolderNode({
  folder,
  lists,
  subfolders,
  onSelectFolder,
  onEdit,
  onDelete,
  onCreateChild,
  level = 0,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showNewChild, setShowNewChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");

  const hasChildren = (subfolders && subfolders.length > 0) || (lists && lists.length > 0);

  const handleCreateChild = async () => {
    if (!newChildName.trim()) return;
    await onCreateChild?.(folder.id, newChildName.trim());
    setNewChildName("");
    setShowNewChild(false);
  };

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 6,
          background: "transparent",
          transition: "background .2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            minWidth: 16,
            background: "none",
            border: "none",
            color: ACCENT,
            cursor: hasChildren ? "pointer" : "default",
            fontSize: 12,
            padding: 0,
          }}
        >
          {hasChildren ? (expanded ? "▼" : "▶") : ""}
        </button>

        <span style={{ color: ACCENT }}>📁</span>

        <button
          onClick={() => onSelectFolder?.(folder)}
          style={{
            flex: 1,
            textAlign: "left",
            background: "none",
            border: "none",
            color: "#111827",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {folder.name}
        </button>

        <span style={{ fontSize: 11, color: "#6b7280" }}>
          {folder.list_count || 0}
        </span>

        <button
          onClick={() => setShowNewChild(true)}
          style={{
            background: "#dbeafe",
            border: "1px solid #93c5fd",
            color: ACCENT,
            cursor: "pointer",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            fontWeight: 600,
          }}
          title="Add subfolder"
        >
          +
        </button>

        <button
          onClick={() => onEdit?.(folder)}
          style={{
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            color: "#374151",
            cursor: "pointer",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            fontWeight: 600,
          }}
          title="Edit"
        >
          ✎
        </button>

        <button
          onClick={() => onDelete?.(folder.id)}
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            cursor: "pointer",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            fontWeight: 600,
          }}
          title="Delete"
        >
          ✕
        </button>
      </div>

      {showNewChild && (
        <div style={{
          marginLeft: `${(level + 1) * 16}px`,
          padding: "8px 12px",
          display: "flex",
          gap: 6,
          marginTop: 6,
        }}>
          <input
            type="text"
            placeholder="Folder name..."
            value={newChildName}
            onChange={e => setNewChildName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateChild()}
            autoFocus
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 4,
              border: `1px solid #d1d5db`,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleCreateChild}
            style={{
              padding: "6px 10px",
              borderRadius: 4,
              background: ACCENT,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowNewChild(false);
              setNewChildName("");
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 4,
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {subfolders && subfolders.map(subfolder => (
            <FolderNode
              key={subfolder.id}
              folder={subfolder}
              lists={subfolder.lists}
              subfolders={subfolder.subfolders}
              onSelectFolder={onSelectFolder}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              level={level + 1}
            />
          ))}

          {lists && lists.map(list => (
            <div
              key={list.id}
              style={{
                marginLeft: `${(level + 1) * 16}px`,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 6,
                cursor: "pointer",
                transition: "background .2s",
              }}
              onClick={() => onSelectFolder?.(list)}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ minWidth: 16 }}></span>
              <span style={{ color: ACCENT }}>📋</span>
              <span style={{ fontSize: 13, flex: 1 }}>{list.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderBrowser({ onSelectFolder, onFoldersChange }) {
  const [folders, setFolders] = useState([]);
  const [rootLists, setRootLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/folders/tree/all", { cache: "no-store" });
      const json = await res.json();
      setFolders(json.folders || []);
      setRootLists(json.rootLists || []);
    } catch (err) {
      console.error("Failed to load folders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(`Error: ${json.error}`);
        return;
      }

      setNewFolderName("");
      setShowNewFolder(false);
      await loadFolders();
    } catch (err) {
      console.error("Create folder error:", err);
      alert("Failed to create folder");
    }
  };

  const handleCreateChild = async (parentId, name) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parent_id: parentId,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(`Error: ${json.error}`);
        return;
      }

      await loadFolders();
    } catch (err) {
      console.error("Create child folder error:", err);
      alert("Failed to create subfolder");
    }
  };

  const handleEditFolder = async (folderId, newName) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to edit");
      }

      setEditingFolder(null);
      setEditName("");
      await loadFolders();
    } catch (err) {
      console.error("Edit folder error:", err);
      alert(`Failed to edit folder: ${err.message}`);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm("Delete this folder? Lists inside will remain.")) return;

    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadFolders();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete folder");
    }
  };

  if (loading) {
    return <div style={{ padding: 16, color: "#6b7280" }}>Loading folders...</div>;
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setShowNewFolder(true)}
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 12,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 6,
            background: ACCENT,
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          + New Folder
        </button>
      </div>

      {showNewFolder && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid #d1d5db`,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreateFolder}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: ACCENT,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName("");
              }}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingFolder && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Edit folder:</div>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEditFolder(editingFolder.id, editName)}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid #d1d5db`,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleEditFolder(editingFolder.id, editName)}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: ACCENT,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingFolder(null);
                setEditName("");
              }}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Root level folders */}
      {folders && folders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          lists={folder.lists}
          subfolders={folder.subfolders}
          onSelectFolder={onSelectFolder}
          onEdit={folder => {
            setEditingFolder(folder);
            setEditName(folder.name);
          }}
          onDelete={handleDeleteFolder}
          onCreateChild={handleCreateChild}
          level={0}
        />
      ))}

      {/* Root level lists */}
      {rootLists && rootLists.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>
            Ungrouped Lists
          </div>
          {rootLists.map(list => (
            <div
              key={list.id}
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 6,
                cursor: "pointer",
                transition: "background .2s",
              }}
              onClick={() => onSelectFolder?.(list)}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: ACCENT }}>📋</span>
              <span style={{ fontSize: 13, flex: 1 }}>{list.name}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && folders.length === 0 && rootLists.length === 0 && (
        <div style={{ padding: 16, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
          No folders yet. Create one to get started!
        </div>
      )}
    </div>
  );
}
