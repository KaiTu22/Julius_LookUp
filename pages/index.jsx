"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import JuliusInfluencerLookup from '../components/JuliusInfluencerLookup';
import DiscoverySearch from '../components/DiscoverySearch';

const ACCENT = "#3b82f6";

const fmt = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export default function Home() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [featured, setFeatured] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [addingToList, setAddingToList] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);

  // Advanced search state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [platform, setPlatform] = useState("all");
  const [interests, setInterests] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleDiscoverySearch = async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({
        platform: platform,
        interests: interests,
        minFollowers: minFollowers || "0",
        maxFollowers: maxFollowers || "",
        sort: "reach-instagram",
        limit: "50",
        offset: "0",
      });
      const res = await fetch(`/api/search-influencers?${params}`);
      const json = await res.json();
      if (res.ok) setSearchResults(json);
    } catch (err) {
      console.error("Discovery search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/featured-influencers");
        const json = await res.json();
        if (res.ok) setFeatured(json.influencers || []);
      } catch (err) {
        console.error("Failed to fetch featured:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();

    // Load user's lists
    const fetchLists = async () => {
      try {
        const res = await fetch("/api/lists", { cache: "no-store" });
        const json = await res.json();
        if (res.ok) setUserLists(json.lists || []);
      } catch (err) {
        console.error("Failed to fetch lists:", err);
      }
    };
    fetchLists();

    // Load recently viewed from localStorage
    try {
      const stored = localStorage.getItem("recentlyViewed");
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load recently viewed:", err);
    }
  }, []);

  // Track recently viewed profiles
  useEffect(() => {
    if (slug) {
      const addToRecentlyViewed = async () => {
        try {
          // Fetch influencer data to add to recently viewed
          const res = await fetch(`/api/typeahead?term=${encodeURIComponent(slug)}`);
          const json = await res.json();
          const results = json.results || [];
          const influencer = results.find(r => r.slug === slug);

          console.log("Adding to recently viewed:", influencer);
          if (influencer) {
            const stored = localStorage.getItem("recentlyViewed");
            let recent = stored ? JSON.parse(stored) : [];

            // Add to front, remove duplicates, keep last 10
            recent = recent.filter(r => r.slug !== slug);
            recent.unshift(influencer);
            recent = recent.slice(0, 10);

            console.log("Storing to localStorage:", recent);
            localStorage.setItem("recentlyViewed", JSON.stringify(recent));
            setRecentlyViewed(recent);
          }
        } catch (err) {
          console.error("Failed to update recently viewed:", err);
        }
      };
      addToRecentlyViewed();
    }
  }, [slug]);

  const handleNameSearch = async (term) => {
    setNameSearch(term);
    if (term.length < 2) {
      setNameSearchResults([]);
      return;
    }

    setNameSearchLoading(true);
    try {
      const res = await fetch(`/api/typeahead?term=${encodeURIComponent(term)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setNameSearchResults(json.results || []);
    } catch (err) {
      setNameSearchResults([]);
    } finally {
      setNameSearchLoading(false);
    }
  };

  const handleSearchEnter = async (e, term) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (nameSearchResults.length > 0) {
      handleNameSearchSelect(nameSearchResults[0]);
    }
  };

  const handleNameSearchSelect = async (influencer) => {
    setNameSearch("");
    setNameSearchResults([]);
    // Archive and navigate to profile
    try {
      await fetch(`/api/archive-influencer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: influencer.slug }),
      });
    } catch (err) {
      console.error("Archive failed:", err);
    }
    window.location.href = `/?slug=${encodeURIComponent(influencer.slug)}`;
  };

  return (
    <div>
      {/* Global Header */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        position: "relative",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: "#111827",
            margin: 0,
          }}>
            Julius Influencer Lookup
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Tools Menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#6b7280",
                  transition: "all .2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.color = ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                Tools ▼
              </button>
              {showToolsMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 20,
                  minWidth: 150,
                }}>
                  {[
                    { href: "/discover", label: "Discover" },
                    { href: "/lists", label: "Lists" },
                    { href: "/archive", label: "Archive" },
                    { href: "/cache", label: "Cache" },
                  ].map(tool => (
                    <a
                      key={tool.href}
                      href={tool.href}
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        textDecoration: "none",
                        color: ACCENT,
                        fontSize: 12,
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 600,
                        transition: "background .2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {tool.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {slug && (
              <a
                href="/"
                style={{
                  color: ACCENT,
                  textDecoration: "none",
                  fontFamily: "'Syne',sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                ← Back
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick Name Search - Hide when viewing profile */}
      {!slug && (
      <div style={{
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        padding: "24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            position: "relative",
            marginBottom: 0,
          }}>
            <input
              type="text"
              value={nameSearch}
              onChange={e => handleNameSearch(e.target.value)}
              onKeyDown={e => handleSearchEnter(e, nameSearch)}
              placeholder="e.g., Taylor Swift or @handle"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "2px solid #3b82f6",
                fontSize: 14,
                fontFamily: "'DM Sans',sans-serif",
                boxSizing: "border-box",
              }}
            />
            {nameSearchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                maxHeight: 400,
                overflowY: "auto",
              }}>
                {nameSearchResults.map(influencer => (
                  <button
                    key={`${influencer.slug}-${influencer.platform || 'base'}`}
                    onClick={() => handleNameSearchSelect(influencer)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 0,
                      border: "none",
                      borderBottom: "1px solid #f3f4f6",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      textAlign: "left",
                      transition: "background .2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {influencer.avatar?.url && (
                      <img
                        src={influencer.avatar.url}
                        alt={influencer.display_name}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {influencer.display_name}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#3b82f6",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {influencer.accountUrl || influencer.platformUrl || "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Link to Advanced Search */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a
              href="/discover"
              style={{
                color: ACCENT,
                textDecoration: "none",
                fontFamily: "'Syne',sans-serif",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              → Advanced Search & Filters
            </a>
          </div>
        </div>
      </div>
      )}

      {/* Featured Section - Hide when viewing profile */}
      {!slug && featured.length > 0 && !loading && (
        <div style={{
          background: "#f9fafb",
          padding: "40px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#111827",
              margin: "0 0 24px 0",
            }}>
              Featured Influencers
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20,
            }}>
              {featured.map(inf => (
                <div
                  key={inf.slug}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Large Image */}
                  <div
                    onClick={() => window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`}
                    style={{
                      aspectRatio: "1 / 1",
                      background: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {inf.avatar?.url ? (
                      <img
                        src={inf.avatar.url}
                        alt={inf.display_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: "#f3f4f6",
                      }} />
                    )}
                  </div>

                  {/* Info Section */}
                  <div style={{ padding: 16 }}>
                    <div
                      onClick={() => window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`}
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#111827",
                        marginBottom: 4,
                        cursor: "pointer",
                      }}
                    >
                      {inf.display_name}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 11,
                      color: "#6b7280",
                      marginBottom: 10,
                    }}>
                      {inf.tagline || "—"}
                    </div>

                    {/* Followers */}
                    <div style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 13,
                      fontWeight: 500,
                      color: ACCENT,
                      marginBottom: 12,
                    }}>
                      {fmt(inf.social_total_count)} followers
                    </div>

                    {/* Add to List Button */}
                    <button
                      onClick={() => setAddingToList(inf)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid " + ACCENT,
                        background: "transparent",
                        color: ACCENT,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'Syne',sans-serif",
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = ACCENT;
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = ACCENT;
                      }}
                    >
                      + Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Section - Hide when viewing profile */}
      {!slug && recentlyViewed.length > 0 && (
        <div style={{
          background: "#ffffff",
          padding: "40px 24px",
          borderTop: "1px solid #e5e7eb",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#111827",
              margin: "0 0 24px 0",
            }}>
              Recently Viewed
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {recentlyViewed.map(inf => (
                <button
                  key={inf.slug}
                  onClick={() => window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    cursor: "pointer",
                    transition: "all .2s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {inf.avatar?.url ? (
                      <img
                        src={inf.avatar.url}
                        alt={inf.display_name}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #e5e7eb",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#e5e7eb",
                        flexShrink: 0,
                      }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {inf.display_name}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 2,
                      }}>
                        {inf.tagline || "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 15,
                        fontWeight: 500,
                        color: ACCENT,
                      }}>
                        {fmt(inf.social_total_count)}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: 10,
                        color: "#6b7280",
                      }}>
                        Followers
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setAddingToList(inf);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid " + ACCENT,
                      background: "transparent",
                      color: ACCENT,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'Syne',sans-serif",
                      transition: "all .2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = ACCENT;
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = ACCENT;
                    }}
                  >
                    + Add to List
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add to List Modal */}
      {addingToList && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }} onClick={() => setAddingToList(null)}>
          <div style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#111827",
              marginBottom: 4,
            }}>
              Add {addingToList.display_name} to a List
            </div>
            <div style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 16,
            }}>
              Select a list or create a new one
            </div>

            {userLists.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  maxHeight: 300,
                  overflowY: "auto",
                }}>
                  {userLists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => {
                        // Add influencer to list
                        fetch(`/api/lists/${list.id}/add-member`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ influencer_slug: addingToList.slug }),
                        }).then(() => {
                          setAddingToList(null);
                          alert(`Added to "${list.name}"`);
                        }).catch(err => {
                          alert(`Error: ${err.message}`);
                        });
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        background: "#f9fafb",
                        color: "#111827",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 500,
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = ACCENT;
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.color = "#111827";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }}
                    >
                      📋 {list.name}
                      {list.member_count > 0 && (
                        <div style={{ fontSize: 11, color: "inherit", marginTop: 2 }}>
                          {list.member_count} member{list.member_count !== 1 ? "s" : ""}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: 16,
                background: "#f9fafb",
                borderRadius: 6,
                textAlign: "center",
                color: "#6b7280",
                fontSize: 13,
                marginBottom: 16,
              }}>
                No lists yet. Create one in the Lists section.
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href="/lists"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  background: ACCENT,
                  color: "#ffffff",
                  textDecoration: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                Go to Lists
              </a>
              <button
                onClick={() => setAddingToList(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile View - Only show when slug is present */}
      {slug && <JuliusInfluencerLookup />}
    </div>
  );
}
