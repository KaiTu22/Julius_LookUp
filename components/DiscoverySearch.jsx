"use client";

const ACCENT = "#3b82f6";

export default function DiscoverySearch({
  platform, setPlatform,
  interests, setInterests,
  minFollowers, setMinFollowers,
  maxFollowers, setMaxFollowers,
  showAdvanced, setShowAdvanced,
  onSearch,
  loading
}) {
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
      {/* Quick Search */}
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
        <input
          type="text"
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
