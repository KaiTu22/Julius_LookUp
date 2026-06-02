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
  const [brands, setBrands] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [sort, setSort] = useState("reach-instagram");
  const [minFollowers, setMinFollowers] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [country, setCountry] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState({}); // tracks which slugs are being archived
  const [archivedSlugs, setArchivedSlugs] = useState(new Set()); // tracks successfully archived slugs
  const [offset, setOffset] = useState(0);

  const SORT_OPTIONS = [
    { value: "reach-instagram", label: "Followers (High to Low)" },
    { value: "engagement-rate-instagram", label: "Engagement Rate (High to Low)" },
    { value: "engagement-instagram", label: "Engagement Count (High to Low)" },
    { value: "price", label: "Price (Low to High)" },
  ];

  const PLATFORMS = [
    { id: "all", label: "All Platforms", icon: "ALL" },
    { id: "instagram", label: "Instagram", icon: "IG" },
    { id: "tiktok", label: "TikTok", icon: "TT" },
    { id: "youtube", label: "YouTube", icon: "YT" },
    { id: "facebook", label: "Facebook", icon: "FB" },
    { id: "twitter", label: "Twitter/X", icon: "TW" },
  ];

  // Common brands for MVP
  const BRAND_OPTIONS = [
    "Nike", "Adidas", "Puma", "Gucci", "Louis Vuitton",
    "Apple", "Samsung", "Google", "Microsoft", "Amazon",
    "Coca-Cola", "Pepsi", "Starbucks", "McDonald's", "KFC",
    "Netflix", "Disney", "HBO", "Spotify", "YouTube",
  ];

  const COUNTRY_OPTIONS = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "IN", name: "India" },
  ];

  const toggleBrand = (brand) => {
    setBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const search = async (pageOffset = 0) => {
    setLoading(true);
    setError(null);
    if (pageOffset === 0) setResults(null);
    setOffset(pageOffset);

    try {
      const params = new URLSearchParams({
        brands: brands.join(","),
        platform: platform,
        sort: sort,
        minFollowers: minFollowers || "0",
        minAge: minAge || "",
        maxAge: maxAge || "",
        country: country || "",
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        offset: pageOffset,
        limit: "50",
      });

      const res = await fetch(`/api/search-influencers?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");

      if (pageOffset === 0) {
        setResults(json);
      } else {
        setResults(prev => ({
          ...json,
          influencers: [...(prev?.influencers || []), ...json.influencers],
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextOffset = (results?.offset || 0) + (results?.limit || 50);
    search(nextOffset);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") search();
  };

  const archiveInfluencer = async (slug) => {
    setArchiving(prev => ({ ...prev, [slug]: true }));
    try {
      const res = await fetch(`/api/archive-influencer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Archive failed");
      setArchivedSlugs(prev => new Set(prev).add(slug));
    } catch (err) {
      setError(err.message);
    } finally {
      setArchiving(prev => ({ ...prev, [slug]: false }));
    }
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
                    border: platform === p.id
                      ? `1px solid ${ACCENT}`
                      : "1px solid #d1d5db",
                    background: platform === p.id
                      ? ACCENT + "22"
                      : "transparent",
                    color: platform === p.id ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = ACCENT;
                    e.currentTarget.style.background = ACCENT + "11";
                  }}
                  onMouseLeave={e => {
                    if (platform !== p.id) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
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
              Sort By
            </label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans',sans-serif",
                border: "1px solid #d1d5db",
                width: "100%",
                maxWidth: 300,
                outline: "none",
                cursor: "pointer",
                background: "#ffffff",
              }}
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Brands */}
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
              Brands (OR logic)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BRAND_OPTIONS.map(brand => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 500,
                    border: brands.includes(brand)
                      ? `1px solid ${ACCENT}`
                      : "1px solid #d1d5db",
                    background: brands.includes(brand)
                      ? ACCENT + "22"
                      : "transparent",
                    color: brands.includes(brand) ? ACCENT : "#6b7280",
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = ACCENT;
                    e.currentTarget.style.background = ACCENT + "11";
                  }}
                  onMouseLeave={e => {
                    if (!brands.includes(brand)) {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {brand}
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
              Min Followers (optional)
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
              Age Range (optional)
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div>
                <input
                  type="number"
                  value={minAge}
                  onChange={e => setMinAge(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Min age"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 100,
                    outline: "none",
                  }}
                />
              </div>
              <span style={{ color: "#9ca3af" }}>to</span>
              <div>
                <input
                  type="number"
                  value={maxAge}
                  onChange={e => setMaxAge(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Max age"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 100,
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {minAge || maxAge ? `Age: ${minAge || "any"} - ${maxAge || "any"}` : "No age filter"}
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
              Country (optional)
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
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
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
              Sponsorship Price Range USD (optional)
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Min price"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 130,
                    outline: "none",
                  }}
                />
              </div>
              <span style={{ color: "#9ca3af" }}>to</span>
              <div>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Max price"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid #d1d5db",
                    width: 130,
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              {minPrice || maxPrice ? `Price: $${minPrice || "any"} - $${maxPrice || "any"}` : "No price filter"}
            </div>
          </div>

        </div>

        {/* Search Button */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => search()}
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
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = ACCENT;
              }
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
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
                {platform === "all" ? "Combined followers" : PLATFORMS.find(p => p.id === platform)?.label}
                {brands.length > 0 && ` · ${brands.join(", ")}`}
                {minFollowers && ` · Min ${fmt(parseInt(minFollowers))} followers`}
                {(minAge || maxAge) && ` · Age ${minAge || "any"}-${maxAge || "any"}`}
                {country && ` · ${COUNTRY_OPTIONS.find(c => c.code === country)?.name}`}
                {(minPrice || maxPrice) && ` · $${minPrice || "any"}-$${maxPrice || "any"}`}
              </p>
            </div>

            {results.influencers && results.influencers.length > 0 ? (
              <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
                {(() => {
                  let displayInfluencers = results.influencers;

                  // Client-side sorting for "all platforms" mode
                  if (platform === "all") {
                    if (sort === "engagement-rate-instagram") {
                      displayInfluencers = [...displayInfluencers].sort((a, b) => {
                        const rateA = a.social_total_count > 0
                          ? (a.social_total_engagement / a.social_total_count) * 100
                          : 0;
                        const rateB = b.social_total_count > 0
                          ? (b.social_total_engagement / b.social_total_count) * 100
                          : 0;
                        return rateB - rateA; // descending
                      });
                    } else if (sort === "engagement-instagram") {
                      displayInfluencers = [...displayInfluencers].sort((a, b) =>
                        (b.social_total_engagement || 0) - (a.social_total_engagement || 0)
                      );
                    }
                  }

                  return displayInfluencers.map(inf => (
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

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          window.location.href = `/?slug=${encodeURIComponent(inf.slug)}`;
                        }}
                        style={{
                          flex: 1,
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
                      <button
                        onClick={() => archiveInfluencer(inf.slug)}
                        disabled={archiving[inf.slug] || archivedSlugs.has(inf.slug)}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          borderRadius: 8,
                          fontSize: 11,
                          fontFamily: "'Syne',sans-serif",
                          fontWeight: 600,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                          border: `1px solid ${archivedSlugs.has(inf.slug) ? "#86efac" : "#d1d5db"}`,
                          background: archivedSlugs.has(inf.slug) ? "#dcfce7" : (archiving[inf.slug] ? "#f3f4f6" : "transparent"),
                          color: archivedSlugs.has(inf.slug) ? "#15803d" : (archiving[inf.slug] ? "#9ca3af" : "#374151"),
                          cursor: archiving[inf.slug] || archivedSlugs.has(inf.slug) ? "default" : "pointer",
                          transition: "all .2s",
                        }}
                        onMouseEnter={e => {
                          if (!archiving[inf.slug] && !archivedSlugs.has(inf.slug)) {
                            e.currentTarget.style.background = "#fef3c7";
                            e.currentTarget.style.borderColor = "#fbbf24";
                            e.currentTarget.style.color = "#92400e";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!archiving[inf.slug] && !archivedSlugs.has(inf.slug)) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "#d1d5db";
                            e.currentTarget.style.color = "#374151";
                          }
                        }}
                      >
                        {archivedSlugs.has(inf.slug) ? "✓ Archived" : (archiving[inf.slug] ? "..." : "Add to Archive")}
                      </button>
                    </div>
                  </div>
                ))
                })()}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Showing {results?.influencers?.length || 0} of {results?.total || 0}
                </div>
                {results?.hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    style={{
                      padding: "12px 32px",
                      borderRadius: 8,
                      border: "1px solid #3b82f6",
                      background: loading ? "#f3f4f6" : "#ffffff",
                      color: loading ? "#9ca3af" : "#3b82f6",
                      fontFamily: "'Syne',sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all .2s",
                    }}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                )}
              </div>
              </>
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
