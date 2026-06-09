const ACCENT = "#3b82f6";

export default function BreadcrumbNav({ path, onNavigate }) {
  if (!path || path.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      marginBottom: 16,
      padding: "8px 0",
      borderBottom: `1px solid #e5e7eb`,
    }}>
      <button
        onClick={() => onNavigate?.(null)}
        style={{
          background: "none",
          border: "none",
          color: ACCENT,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        Home
      </button>

      {path.map((folder, idx) => (
        <div key={folder.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#d1d5db" }}>/</span>
          <button
            onClick={() => onNavigate?.(folder.id)}
            style={{
              background: "none",
              border: "none",
              color: idx === path.length - 1 ? "#111827" : ACCENT,
              cursor: "pointer",
              fontWeight: idx === path.length - 1 ? 600 : 500,
              fontSize: 12,
            }}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </div>
  );
}
