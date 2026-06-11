"use client";
import { useState, useEffect } from "react";

const ACCENT = "#3b82f6";

function TreeNode({ folder, subfolders, onSelectFolder, selectedId, level = 0 }) {
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
        <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: "#111827", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {folder.name}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {subfolders.map(sub => (
            <TreeNode
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

export default function FolderNavigator({ selectedFolder, onSelectFolder }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div style={{ padding: 12, fontSize: 12, color: "#6b7280" }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>
        Folders
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {folders.map(folder => (
          <TreeNode
            key={folder.id}
            folder={folder}
            subfolders={folder.subfolders}
            onSelectFolder={onSelectFolder}
            selectedId={selectedFolder?.id}
            level={0}
          />
        ))}
        {folders.length === 0 && (
          <div style={{ fontSize: 12, color: "#9ca3af", padding: 8 }}>
            No folders yet
          </div>
        )}
      </div>
    </div>
  );
}
