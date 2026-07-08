"use client";

const ACCENT = "#3b82f6";

const fmt = n => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export default function InfluencerCard({
  slug,
  displayName,
  avatar,
  followerCount,
  onClick,
  compact = false,
}) {
  return (
    <div
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
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Image - prominent at top */}
      <div
        style={{
          aspectRatio: "1 / 1",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {avatar?.url ? (
          <img
            src={avatar.url}
            alt={displayName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#f3f4f6" }} />
        )}
      </div>

      {/* Content section */}
      <div style={{ padding: compact ? 12 : 16, display: "flex", flexDirection: "column", gap: compact ? 8 : 12 }}>
        {/* Name - prominent */}
        <div>
          <div
            style={{
              fontFamily: "'Instrument Sans',sans-serif",
              fontWeight: 700,
              fontSize: compact ? 12 : 14,
              color: "#111827",
              lineHeight: 1.4,
            }}
          >
            {displayName}
          </div>
        </div>

        {/* Followers - secondary */}
        <div
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: compact ? 11 : 13,
            fontWeight: 500,
            color: ACCENT,
          }}
        >
          {fmt(followerCount || 0)} followers
        </div>

        {/* View Profile button - least prominent */}
        <button
          onClick={e => {
            e.stopPropagation();
            window.open(`/?slug=${encodeURIComponent(slug)}`, "_blank");
          }}
          style={{
            padding: compact ? "6px 12px" : "8px 12px",
            borderRadius: 6,
            border: `1px solid ${ACCENT}`,
            background: "transparent",
            color: ACCENT,
            cursor: "pointer",
            fontSize: compact ? 10 : 11,
            fontWeight: 600,
            fontFamily: "'Instrument Sans',sans-serif",
            transition: "all .2s",
            marginTop: "auto",
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
          View Profile
        </button>
      </div>
    </div>
  );
}
