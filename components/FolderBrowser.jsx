"use client";
import { useState, useEffect } from "react";

const ACCENT = "#3b82f6";

function SimpleTreeNode({ folder, subfolders, onSelectFolder, selectedId, level = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = subfolders && subfolders.length > 0;
  const isSelected = folder.id === selectedId;

  return (
    <div>
      <div
        onClick={() => {
          onSelectFolder(folder);
          if (hasChildren) setExpanded(!expanded);
        }}
        style={{
          marginLeft: `${level * 16}px`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          background: isSelected ? "#dbeafe" : "transparent",
          borderRadius: 6,
          transition: "background .2s",
        }}
        onMouseEnter={e => !isSelected && (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ minWidth: 16, fontSize: 12, color: ACCENT }}>
          {hasChildren ? (expanded ? "▼" : "▶") : ""}
        </span>
        <span style={{ color: ACCENT }}>📁</span>
        <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: "#111827", flex: 1 }}>
          {folder.name}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {subfolders.map(sub => (
            <SimpleTreeNode
              key={sub.id}
              folder={sub}
              subfolders={sub.subfolders}
              onSelectFolder={onSelectFolder}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentPanel({ folder, lists, subfolders, onSelectFolder, onCreateChild, onEdit, onDelete, onNewRootFolder, folders }) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState("");

  const breadcrumb = folder ? [folder] : [];

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const parentId = folder ? folder.id : null;
    await onCreateChild?.(parentId, newFolderName.trim());
    setNewFolderName("");
    setShowNewForm(false);
  };

  const handleSaveEdit = async (folderId, newName) => {
    await onEdit?.(folderId, newName);
    setEditingFolder(null);
    setEditName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Breadcrumb + Toolbar */}
      <div style={{ paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          {folder ? folder.name : "All Folders"}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              background: ACCENT,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Syne',sans-serif",
            }}
          >
            + New Folder
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showNewForm && (
        <div style={{ padding: 12, background: "#f9fafb", borderRadius: 6, marginBottom: 12 }}>
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
              border: "1px solid #d1d5db",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
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
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
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
                fontSize: 11,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingFolder && (
        <div style={{ padding: 12, background: "#f9fafb", borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Edit folder:</div>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSaveEdit(editingFolder.id, editName)}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => handleSaveEdit(editingFolder.id, editName)}
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 6,
                background: ACCENT,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
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
                fontSize: 11,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {subfolders && subfolders.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase" }}>
              Folders
            </div>
            {subfolders.map(subfolder => (
              <div
                key={subfolder.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "transparent",
                  transition: "background .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ color: ACCENT }}>📁</span>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onSelectFolder?.(subfolder)}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                    {subfolder.name}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {subfolder.list_count || 0}
                </span>

                {/* Action Buttons - appear on hover */}
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => onCreateChild?.(subfolder.id, "New Folder")}
                    title="Add subfolder"
                    style={{
                      background: "#dbeafe",
                      border: "1px solid #93c5fd",
                      color: ACCENT,
                      cursor: "pointer",
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      setEditingFolder(subfolder);
                      setEditName(subfolder.name);
                    }}
                    title="Edit"
                    style={{
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete?.(subfolder.id)}
                    title="Delete"
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {lists && lists.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase" }}>
              Lists
            </div>
            {lists.map(list => (
              <div
                key={list.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "transparent",
                  transition: "background .2s",
                  cursor: "pointer",
                }}
                onClick={() => onSelectFolder?.(list)}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ color: ACCENT }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                    {list.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!subfolders?.length && !lists?.length && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "24px 12px", fontSize: 13 }}>
            {folder ? "No folders or lists in this folder" : "Create a folder to get started"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FolderBrowser({ onSelectFolder, onFoldersChange }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/folders/tree/all", { cache: "no-store" });
      const json = await res.json();
      setFolders(json.folders || []);
    } catch (err) {
      console.error("Failed to load folders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleCreateChild = async (parentId, name) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });

      if (!res.ok) {
        const json = await res.json();
        alert(`Error: ${json.error}`);
        return;
      }

      await loadFolders();
    } catch (err) {
      console.error("Create folder error:", err);
      alert("Failed to create folder");
    }
  };

  const handleEdit = async (folderId, newName) => {
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

      await loadFolders();
    } catch (err) {
      console.error("Edit folder error:", err);
      alert(`Failed to edit folder: ${err.message}`);
    }
  };

  const handleDelete = async (folderId) => {
    if (!confirm("Delete this folder? Lists inside will remain.")) return;

    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await loadFolders();
      setSelectedFolder(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete folder");
    }
  };

  if (loading) {
    return <div style={{ padding: 16, color: "#6b7280" }}>Loading folders...</div>;
  }

  // Find selected folder data from tree
  let selectedFolderData = null;
  const findFolder = (folders, id) => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolder(folder.subfolders || [], id);
      if (found) return found;
    }
    return null;
  };

  if (selectedFolder?.id) {
    selectedFolderData = findFolder(folders, selectedFolder.id);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, height: "600px" }}>
      {/* Left: Folder Tree */}
      <div style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        overflowY: "auto",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>
          Folders
        </div>
        {folders.map(folder => (
          <SimpleTreeNode
            key={folder.id}
            folder={folder}
            subfolders={folder.subfolders}
            onSelectFolder={setSelectedFolder}
            selectedId={selectedFolder?.id}
            level={0}
          />
        ))}
      </div>

      {/* Right: Content Panel */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
      }}>
        <ContentPanel
          folder={selectedFolder}
          lists={selectedFolderData?.lists || []}
          subfolders={selectedFolderData?.subfolders || []}
          onSelectFolder={setSelectedFolder}
          onCreateChild={handleCreateChild}
          onEdit={handleEdit}
          onDelete={handleDelete}
          folders={folders}
        />
      </div>
    </div>
  );
}
