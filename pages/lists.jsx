"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FolderNavigator from "@/components/FolderNavigator";
import FolderStats from "@/components/FolderStats";
import FolderSearch from "@/components/FolderSearch";
import ListFolderPicker from "@/components/ListFolderPicker";

const ACCENT = "#3b82f6";

const fontLink = typeof document !== "undefined" && (() => {
  if (!document.getElementById("julius-fonts")) {
    const l = document.createElement("link");
    l.id = "julius-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(l);
  }
})();

const fmtDate = iso => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
};

export default function ListsPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [movingList, setMovingList] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewFilter, setViewFilter] = useState("all"); // all, ungrouped, grouped

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lists", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load lists");
      setLists(json.lists || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      setShowNew(false);
      setNewName("");
      setNewDescription("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteList = async (id) => {
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: "'DM Sans',sans-serif", padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 12 }}>
          <Link href="/" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Search
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 32,
              letterSpacing: -0.5, color: "#111827", margin: 0,
            }}>
              Lists & Projects
            </h1>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {lists.length === 0 ? "No lists yet" : `${lists.length} list${lists.length === 1 ? "" : "s"}`}
              <span style={{ marginLeft: 12 }}>·</span>
              <Link href="/archive" style={{ marginLeft: 12, color: ACCENT, textDecoration: "none" }}>
                Archive →
              </Link>
              <Link href="/" style={{ marginLeft: 12, color: ACCENT, textDecoration: "none" }}>
                Search →
              </Link>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              padding: "10px 20px", borderRadius: 8,
              border: "none", background: ACCENT, color: "#ffffff",
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12,
              letterSpacing: 1, textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            + New List
          </button>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: 16, color: "#991b1b", marginBottom: 16,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {showNew && (
          <div style={{
            background: "#ffffff", border: "1px solid #e5e7eb",
            borderRadius: 12, padding: 24, marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11,
              letterSpacing: 3, textTransform: "uppercase",
              color: "#6b7280", marginBottom: 14,
            }}>
              New List
            </div>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()}
              placeholder="List name (e.g. Q3 Beauty Campaign)"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontFamily: "'DM Sans',sans-serif",
                fontSize: 14, marginBottom: 10, outline: "none",
              }}
            />
            <input
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()}
              placeholder="Description (optional)"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: "1px solid #d1d5db", fontFamily: "'DM Sans',sans-serif",
                fontSize: 13, marginBottom: 14, outline: "none", color: "#374151",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowNew(false); setNewName(""); setNewDescription(""); }}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#ffffff", color: "#6b7280", cursor: "pointer",
                  fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 11,
                  letterSpacing: 1, textTransform: "uppercase",
                }}
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={!newName.trim() || creating}
                style={{
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: !newName.trim() || creating ? "#d1d5db" : ACCENT,
                  color: "#ffffff", cursor: !newName.trim() || creating ? "not-allowed" : "pointer",
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 11,
                  letterSpacing: 1, textTransform: "uppercase",
                }}
              >
                {creating ? "Creating…" : "Create List"}
              </button>
            </div>
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 24,
        }}>
          {/* Sidebar: Folder Browser */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            height: "fit-content",
            position: "sticky",
            top: 20,
          }}>
            <FolderStats />
            <FolderSearch onSelectItem={setSelectedFolder} />
            <h2 style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 13,
              fontWeight: 700,
              margin: "0 0 12px 0",
            }}>
              Organize
            </h2>
            <FolderNavigator selectedFolder={selectedFolder} onSelectFolder={setSelectedFolder} />
          </div>

          {/* Main: Lists Grid */}
          <div>
            {/* Breadcrumb + Filters */}
            <div style={{
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}>
              <div style={{
                fontSize: 13,
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <button
                  onClick={() => setSelectedFolder(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: selectedFolder ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    fontWeight: selectedFolder ? 400 : 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  🏠 Home
                </button>
                {selectedFolder && (
                  <>
                    <span style={{ color: "#d1d5db" }}>/</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {selectedFolder.name}
                    </span>
                  </>
                )}
              </div>

              {/* Filter Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setViewFilter("all"); setSelectedFolder(null); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${viewFilter === "all" ? ACCENT : "#d1d5db"}`,
                    background: viewFilter === "all" ? ACCENT : "#fff",
                    color: viewFilter === "all" ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => { setViewFilter("ungrouped"); setSelectedFolder(null); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${viewFilter === "ungrouped" ? ACCENT : "#d1d5db"}`,
                    background: viewFilter === "ungrouped" ? ACCENT : "#fff",
                    color: viewFilter === "ungrouped" ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  Ungrouped
                </button>
                <button
                  onClick={() => { setViewFilter("grouped"); setSelectedFolder(null); }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${viewFilter === "grouped" ? ACCENT : "#d1d5db"}`,
                    background: viewFilter === "grouped" ? ACCENT : "#fff",
                    color: viewFilter === "grouped" ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  Grouped
                </button>
              </div>
            </div>

            {loading && !lists.length ? (
              <div style={{ color: "#9ca3af", padding: 24 }}>Loading…</div>
            ) : (
              <>
                {/* View Title */}
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}>
                    Lists in: {selectedFolder ? selectedFolder.name : "All"}
                  </h2>
                </div>

                {/* Lists Grid */}
                {(() => {
                  let filtered = lists;
                  if (selectedFolder) {
                    filtered = lists.filter(l => l.folder_id === selectedFolder.id);
                  } else if (viewFilter === "ungrouped") {
                    filtered = lists.filter(l => !l.folder_id);
                  } else if (viewFilter === "grouped") {
                    filtered = lists.filter(l => l.folder_id);
                  }
                  return filtered;
                })().length === 0 ? (
                  <div style={{
                    background: "#ffffff", border: "1px dashed #d1d5db",
                    borderRadius: 12, padding: "48px 24px", textAlign: "center",
                    color: "#6b7280",
                  }}>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      {selectedFolder ? "No lists in this folder." : "No lists yet."}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {selectedFolder
                        ? "Create a new list or move lists here from the Move button."
                        : "Create your first list, then add influencers from their profile or this page."}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                  }}>
                    {(() => {
                      let filtered = lists;
                      if (selectedFolder) {
                        filtered = lists.filter(l => l.folder_id === selectedFolder.id);
                      } else if (viewFilter === "ungrouped") {
                        filtered = lists.filter(l => !l.folder_id);
                      } else if (viewFilter === "grouped") {
                        filtered = lists.filter(l => l.folder_id);
                      }
                      return filtered;
                    })().map(l => (
                  <div key={l.id} style={{
                    background: "#ffffff", border: "1px solid #e5e7eb",
                    borderRadius: 12, padding: 20,
                    display: "flex", flexDirection: "column",
                  }}>
                    <Link href={`/lists/${l.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                      <div style={{
                        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18,
                        color: "#111827", marginBottom: 4,
                      }}>
                        {l.name}
                      </div>
                      {l.description && (
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                          {l.description}
                        </div>
                      )}
                      <div style={{
                        fontFamily: "'DM Mono',monospace", fontSize: 12, color: ACCENT,
                        marginTop: 8,
                      }}>
                        {l.member_count} {l.member_count === 1 ? "member" : "members"}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                        Created {fmtDate(l.created_at)}
                      </div>
                    </Link>
                    {movingList === l.id && (
                      <div style={{ marginTop: 14 }}>
                        <ListFolderPicker
                          listId={l.id}
                          currentFolderId={l.folder_id}
                          onMove={() => {
                            setMovingList(null);
                            load();
                          }}
                          onClose={() => setMovingList(null)}
                        />
                      </div>
                    )}
                    <div style={{ marginTop: 14, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {!movingList && (
                        <>
                          <button
                            onClick={() => setMovingList(l.id)}
                            style={{
                              padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                              background: "transparent", color: ACCENT, cursor: "pointer",
                              fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10,
                              letterSpacing: 1, textTransform: "uppercase",
                            }}
                          >Move</button>
                          {confirmDelete === l.id ? (
                            <>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                  padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                                  background: "#ffffff", color: "#6b7280", cursor: "pointer",
                                  fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10,
                                  letterSpacing: 1, textTransform: "uppercase",
                                }}
                              >Cancel</button>
                              <button
                                onClick={() => deleteList(l.id)}
                                style={{
                                  padding: "4px 10px", borderRadius: 6, border: "none",
                                  background: "#ef4444", color: "#ffffff", cursor: "pointer",
                                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
                                  letterSpacing: 1, textTransform: "uppercase",
                                }}
                              >Confirm Delete</button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(l.id)}
                              style={{
                                padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                                background: "transparent", color: "#9ca3af", cursor: "pointer",
                                fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 10,
                                letterSpacing: 1, textTransform: "uppercase",
                              }}
                            >Delete</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
