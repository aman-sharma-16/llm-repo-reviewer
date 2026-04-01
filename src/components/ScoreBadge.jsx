export default function ScoreBadge({ score, label }) {
  const n = parseFloat(score);
  let color, bg;

  if (n >= 8) {
    color = "#34d399";
    bg = "#064e3b";
  } else if (n >= 6) {
    color = "#fbbf24";
    bg = "#451a03";
  } else {
    color = "#f87171";
    bg = "#450a0a";
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      padding: "12px",
      borderRadius: "8px",
      border: `1px solid ${color}33`,
      background: bg,
    }}>
      {label && (
        <span style={{
          fontSize: "12px",
          color: "#cbd5e1",
          fontWeight: 500,
          textAlign: "center",
        }}>
          {label}
        </span>
      )}
      <span style={{
        background: bg,
        color,
        padding: "4px 12px",
        borderRadius: "20px",
        fontSize: "18px",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
      }}>
        {score}
      </span>
    </div>
  );
}

export { ScoreBadge };
