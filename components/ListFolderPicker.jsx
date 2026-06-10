"use client";
import { useState, useEffect } from "react";

const ACCENT = "#3b82f6";

function FolderOption({ folder, subfolders, level, selectedId, onSelect }) {
  const indent = "─ ".repeat(level);
  return (
    <>
      <option value={folder.id}>
        {indent}{folder.name} ({level})
      </option>
      {subfolders && subfolders.map(sub => (
        <FolderOption
          key={sub.id}
          folder={sub}
          subfolders={sub.subfolders}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function ListFolderPicker({ listId, currentFolderId, onMove, onClose }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || "");
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
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

    loadFolders();
  }, []);

  const handleMove = async () => {
    if (!listId) return;

    setMoving(true);
    try {
      const res = await fetch(`/api/lists/${listId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: selectedFolderId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to move list");

      // Small delay to ensure database update is complete before refresh
      setTimeout(() => {
        onMove?.();
      }, 100);
    } catch (err) {
      console.error("Move error:", err);
      setMoving(false);
    }
  };

  return (
    <div style={{
      padding: 16,
      background: "#fff",
      borderRadius: 8,
      border: `1px solid #e5e7eb`,
    }}>
      <h3 style={{
        fontFamily: "'Syne',sans-serif",
        fontSize: 14,
        fontWeight: 700,
        margin: "0 0 12px 0",
      }}>
        Move to Folder
      </h3>

      {loading ? (
        <div style={{ color: "#6b7280", fontSize: 12 }}>Loading folders...</div>
      ) : (
        <>
          <select
            value={selectedFolderId}
            onChange={e => setSelectedFolderId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: `1px solid #d1d5db`,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 13,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          >
            <option value="">— No folder (root)</option>
            {folders && folders.map(folder => (
              <FolderOption
                key={folder.id}
                folder={folder}
                subfolders={folder.subfolders}
                level={0}
                selectedId={selectedFolderId}
              />
            ))}
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleMove}
              disabled={moving}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 6,
                background: ACCENT,
                color: "#fff",
                border: "none",
                cursor: moving ? "default" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                opacity: moving ? 0.6 : 1,
              }}
            >
              {moving ? "Moving..." : "Move"}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "8px 12px",
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
        </>
      )}
    </div>
  );
}
