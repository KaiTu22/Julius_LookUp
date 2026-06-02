"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

const fmt = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export default function DiscoverPage() {
  const [interests, setInterests] = useState([]);
  const [minFollowers, setMinFollowers] = useState("");
  const [country, setCountry] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [minEngagement, setMinEngagement] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Common interests for MVP
  const INTEREST_OPTIONS = [
    "Beauty", "Fashion", "Fitness", "Health", "Wellness",
    "Technology", "Gaming", "Entertainment", "Music", "Film",
    "Sports", "Travel", "Food", "Cooking", "Lifestyle",
    "DIY", "Art", "Photography", "Education", "Business"
  ];

  const COUNTRY_OPTIONS = [
    "United States", "Canada", "United Kingdom", "Australia",
    "Germany", "France", "Spain", "Italy", "Japan", "South Korea",
    "Brazil", "Mexico", "India", "Indonesia", "Philippines"
  ];

  const AGE_RANGES = [
    { label: "13-17", value: "13-17" },
    { label: "18-24", value: "18-24" },
    { label: "25-34", value: "25-34" },
    { label: "35-44", value: "35-44" },
    { label: "45-54", value: "45-54" },
    { label: "55+", value: "55+" },
  ];

  const toggleInterest = (int) => {
    setInterests(prev =>
      prev.includes(int)
        ? prev.filter(i => i !== int)
        : [...prev, int]
    );
  };

  const search = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const params = new URLSearchParams({
        interests: interests.join(","),
        minFollowers: minFollowers || "0",
        country: country || "",
        ageRange: ageRange || "",
        minEngagement: minEngagement || "0",
      });

      const res = await fetch(`/api/search-influencers?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setResults(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") search();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",
      fontFamily: "'DM Sans',sans-serif",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Back link */}
        <div style={{ marginBottom: 12 }}>
          <Link href="/" style={{ color: ACCENT, textDecoration: "none", fontSize: 13 }}>
            ← Back to Search
          </Link>
        </div>

        {/* Header */}
        <h1 style={{
          fontFamily: "'Syne',sans-serif",
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: -0.5,
          color: "#111827",
          margin: "0 0 8px 0",
        }}>
          Discover Influencers
        </h1>
        <p style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 14,
          color: "#6b7280",
          margin: "0 0 32px 0",
        }}>
          Find and filter influencers by interests, followers, location, and engagement
        </p>

        {/* Filters */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "24px",
          marginBottom: 32,
        }}>

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
              Primary Interests (AND logic)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INTEREST_OPTIONS.map(int => (
                <button
                  key={int}
                  onClick={() => toggleInterest(int)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 500,
                    border: interests.includes(int)
                      ? `1px solid ${ACCENT}`
                      : "1px solid #d1d5db",
                    background: interests.includes(int)
                      ? ACCENT + "22"
                      : "transparent",
                    color: interests.includes(int) ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = ACCENT;
                    e.currentTarget.style.background = ACCENT + "11";
                  }}
                  onMouseLeave={e => {
                    if (!interests.includes(int)) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>

          {/* Min Followers */}
          <div style={{ marginBottom: 28 }}>
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
              Min Followers
            </label>
            <input
              type="number"
              value={minFollowers}
              onChange={e => setMinFollowers(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 10000"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                border: "1px solid #d1d5db",
                width: "100%",
                maxWidth: 200,
                outline: "none",
              }}
            />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {minFollowers ? `Minimum: ${fmt(parseInt(minFollowers))}` : "No minimum"}
            </div>
          </div>

          {/* Country */}
          <div style={{ marginBottom: 28 }}>
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
              Country/Location
            </label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                border: "1px solid #d1d5db",
                width: "100%",
                maxWidth: 250,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Any country</option>
              {COUNTRY_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Age Range */}
          <div style={{ marginBottom: 28 }}>
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
              Audience Age Range
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AGE_RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setAgeRange(ageRange === r.value ? "" : r.value)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 500,
                    border: ageRange === r.value
                      ? `1px solid ${ACCENT}`
                      : "1px solid #d1d5db",
                    background: ageRange === r.value
                      ? ACCENT + "22"
                      : "transparent",
                    color: ageRange === r.value ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = ACCENT;
                    e.currentTarget.style.background = ACCENT + "11";
                  }}
                  onMouseLeave={e => {
                    if (ageRange !== r.value) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min Engagement Rate */}
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
              Min Engagement Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={minEngagement}
              onChange={e => setMinEngagement(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 2.5"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                border: "1px solid #d1d5db",
                width: "100%",
                maxWidth: 200,
                outline: "none",
              }}
            />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {minEngagement ? `Minimum: ${minEngagement}%` : "No minimum"}
            </div>
          </div>

        </div>

        {/* Search Button */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={search}
            disabled={loading || interests.length === 0}
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "'Syne',sans-serif",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              border: "none",
              background: loading || interests.length === 0 ? "#d1d5db" : ACCENT,
              color: "#ffffff",
              cursor: loading || interests.length === 0 ? "not-allowed" : "pointer",
              transition: "all .2s",
            }}
            onMouseEnter={e => {
              if (!loading && interests.length > 0) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={e => {
              if (!loading && interests.length > 0) {
                e.currentTarget.style.background = ACCENT;
              }
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          {interests.length === 0 && !loading && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
              Select at least one interest to search
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: 16,
            color: "#991b1b",
            marginBottom: 24,
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#111827",
                margin: 0,
              }}>
                {results.total?.toLocaleString() || "?"} Results Found
              </h2>
              <p style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 12,
                color: "#6b7280",
                margin: "4px 0 0 0",
              }}>
                {interests.join(", ")} · Min {fmt(parseInt(minFollowers || 0))} followers
                {country && ` · ${country}`}
              </p>
            </div>

            {results.influencers && results.influencers.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
                {results.influencers.map(inf => (
                  <div
                    key={inf.slug}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "18px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
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
                          {inf.tagline || inf.current_location?.display_name || "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
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
                      {inf.social_total_count > 0 && (
                        <div>
                          <div style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#38bdf8",
                          }}>
                            {((inf.social_total_engagement / inf.social_total_count) * 100).toFixed(2)}%
                          </div>
                          <div style={{
                            fontFamily: "'DM Sans',sans-serif",
                            fontSize: 10,
                            color: "#6b7280",
                          }}>
                            Engagement
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`;
                      }}
                      style={{
                        padding: "7px 0",
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        border: `1px solid #d1d5db`,
                        background: "transparent",
                        color: "#374151",
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#e5e7eb";
                        e.currentTarget.style.borderColor = ACCENT;
                        e.currentTarget.style.color = ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "#d1d5db";
                        e.currentTarget.style.color = "#374151";
                      }}
                    >
                      View Profile →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 32,
                textAlign: "center",
                color: "#6b7280",
              }}>
                No influencers found matching your filters. Try adjusting your search criteria.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
