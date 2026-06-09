import { useState } from "react";

const ACCENT = "#3b82f6";

function FolderNode({ folder, lists, subfolders, onSelectFolder, level = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const hasChildren = (subfolders && subfolders.length > 0) || (lists && lists.length > 0);

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "#111827",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          transition: "background .2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ minWidth: 16 }}>
          {hasChildren ? (expanded ? "▼" : "▶") : ""}
        </span>
        <span style={{ fontWeight: 600, color: ACCENT }}>📁</span>
        <span>{folder.name}</span>
      </button>

      {expanded && hasChildren && (
        <div>
          {/* Subfolders */}
          {subfolders && subfolders.map(subfolder => (
            <FolderNode
              key={subfolder.id}
              folder={subfolder}
              lists={subfolder.lists}
              subfolders={subfolder.subfolders}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}

          {/* Lists in this folder */}
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
              <span style={{ color: ACCENT }}>📋</span>
              <span style={{ fontSize: 13 }}>{list.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ folders, rootLists, onSelectFolder }) {
  return (
    <div style={{ padding: "16px 0" }}>
      {/* Root level folders */}
      {folders && folders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          lists={folder.lists}
          subfolders={folder.subfolders}
          onSelectFolder={onSelectFolder}
          level={0}
        />
      ))}

      {/* Root level lists (not in any folder) */}
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
              <span style={{ fontSize: 13 }}>{list.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
