"use client";
import { useState } from "react";

const ACCENT = "#3b82f6";

export default function FolderSearch({ onSelectItem }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);

    if (q.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/folders/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search folders & lists..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: `1px solid #d1d5db`,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            boxSizing: "border-box",
          }}
        />

        {showResults && results && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: `1px solid #e5e7eb`,
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
            maxHeight: 300,
            overflowY: "auto",
          }}>
            {loading && (
              <div style={{ padding: 12, color: "#6b7280", fontSize: 11 }}>
                Searching...
              </div>
            )}

            {!loading && results.total === 0 && query.length >= 2 && (
              <div style={{ padding: 12, color: "#6b7280", fontSize: 11 }}>
                No results found
              </div>
            )}

            {!loading && results.folders && results.folders.length > 0 && (
              <>
                <div style={{
                  padding: "8px 12px",
                  background: "#f9fafb",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6b7280",
                  borderBottom: "1px solid #e5e7eb",
                }}>
                  Folders
                </div>
                {results.folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onSelectItem?.(folder);
                      setShowResults(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #f3f4f6",
                      fontSize: 12,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 500, color: "#111827" }}>
                      📁 {folder.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                      {folder.list_count} lists
                    </div>
                  </button>
                ))}
              </>
            )}

            {!loading && results.lists && results.lists.length > 0 && (
              <>
                <div style={{
                  padding: "8px 12px",
                  background: "#f9fafb",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6b7280",
                  borderBottom: "1px solid #e5e7eb",
                }}>
                  Lists
                </div>
                {results.lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      onSelectItem?.(list);
                      setShowResults(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #f3f4f6",
                      fontSize: 12,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 500, color: "#111827" }}>
                      📋 {list.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                      {list.member_count} members {list.folder_name ? `• in ${list.folder_name}` : ""}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
