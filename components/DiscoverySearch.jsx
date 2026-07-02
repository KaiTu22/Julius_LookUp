"use client";

import { useState } from "react";

const ACCENT = "#3b82f6";

export default function DiscoverySearch({
  platform, setPlatform,
  interests, setInterests,
  minFollowers, setMinFollowers,
  maxFollowers, setMaxFollowers,
  showAdvanced, setShowAdvanced,
  onSearch,
  loading,
  onNameSearchSelect // optional callback when user selects from autocomplete
}) {
  const [nameSearch, setNameSearch] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);

  const handleNameSearch = async (term) => {
    setNameSearch(term);
    if (term.length < 2) {
      setNameSearchResults([]);
      return;
    }
    setNameSearchLoading(true);
    try {
      const res = await fetch(`/api/typeahead?term=${encodeURIComponent(term)}`);
      const json = await res.json();
      if (res.ok) setNameSearchResults(json.results || []);
    } catch (err) {
      setNameSearchResults([]);
    } finally {
      setNameSearchLoading(false);
    }
  };

  const handleNameSearchSelect = (influencer) => {
    if (onNameSearchSelect) {
      onNameSearchSelect(influencer);
    }
    setNameSearch("");
    setNameSearchResults([]);
  };

  const PLATFORMS = [
    { id: "all", label: "All Platforms", icon: "ALL" },
    { id: "instagram", label: "Instagram", icon: "IG" },
    { id: "tiktok", label: "TikTok", icon: "TT" },
    { id: "youtube", label: "YouTube", icon: "YT" },
    { id: "facebook", label: "Facebook", icon: "FB" },
    { id: "twitter", label: "Twitter/X", icon: "TW" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      {/* Quick Search with Autocomplete */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "block",
          fontFamily: "'Syne',sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: 8,
        }}>
          Search by Name or Handle
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={nameSearch}
            onChange={e => handleNameSearch(e.target.value)}
            placeholder="e.g., Taylor Swift, @taylorswift, Cristiano Ronaldo"
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
              maxHeight: 300,
              overflowY: "auto",
            }}>
              {nameSearchResults.map(influencer => (
                <button
                  key={influencer.slug}
                  onClick={() => handleNameSearchSelect(influencer)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
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
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          fontFamily: "'Syne',sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: ACCENT,
          cursor: "pointer",
          marginBottom: 24,
          padding: 0,
        }}
      >
        <span>{showAdvanced ? "−" : "+"}</span>
        Advanced Filters
      </button>

      {/* Advanced Filters - Collapsible */}
      {showAdvanced && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 32,
        }}>
          {/* Platform Selection */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 12,
            }}>
              Platform
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 500,
                    border: platform === p.id ? `1px solid ${ACCENT}` : "1px solid #d1d5db",
                    background: platform === p.id ? ACCENT + "22" : "transparent",
                    color: platform === p.id ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 12,
            }}>
              Interests
            </label>
            <input
              type="text"
              value={interests}
              onChange={e => setInterests(e.target.value)}
              placeholder="e.g. fashion, entrepreneur, fitness (comma-separated)"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Follower Range */}
          <div style={{ marginBottom: 0 }}>
            <label style={{
              display: "block",
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 8,
            }}>
              Follower Range (optional)
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div>
                <input
                  type="number"
                  value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  placeholder="Min followers"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 150,
                    outline: "none",
                  }}
                />
              </div>
              <span style={{ color: "#9ca3af" }}>to</span>
              <div>
                <input
                  type="number"
                  value={maxFollowers}
                  onChange={e => setMaxFollowers(e.target.value)}
                  placeholder="Max followers"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 150,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Button */}
      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          padding: "12px 32px",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "'Syne',sans-serif",
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          border: "none",
          background: loading ? "#d1d5db" : ACCENT,
          color: "#ffffff",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all .2s",
        }}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
