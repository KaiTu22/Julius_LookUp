"use client";
import { useState } from "react";

const ACCENT = "#3b82f6";

export default function BulkListSelector({ lists, onSelectChange, onBatchMove }) {
  const [selected, setSelected] = useState(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);

  const handleToggleSelect = (listId) => {
    const newSelected = new Set(selected);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelected(newSelected);
    onSelectChange?.(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === lists.length) {
      setSelected(new Set());
      onSelectChange?.(new Set());
    } else {
      const newSelected = new Set(lists.map(l => l.id));
      setSelected(newSelected);
      onSelectChange?.(newSelected);
    }
  };

  if (lists.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16, padding: 12, background: "#f0f4ff", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={selected.size === lists.length && lists.length > 0}
          indeterminate={selected.size > 0 && selected.size < lists.length}
          onChange={handleSelectAll}
          style={{ cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>

        {selected.size > 0 && (
          <>
            <button
              onClick={() => setShowMoveModal(true)}
              style={{
                marginLeft: 12,
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
              Move ({selected.size})
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {showMoveModal && (
        <div style={{
          padding: 12,
          background: "#fff",
          borderRadius: 6,
          border: `1px solid #d1d5db`,
          marginTop: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Move to folder:
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => {
                onBatchMove?.(Array.from(selected), null);
                setShowMoveModal(false);
                setSelected(new Set());
              }}
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
              Root (ungrouped)
            </button>
            <button
              onClick={() => setShowMoveModal(false)}
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
    </div>
  );
}
