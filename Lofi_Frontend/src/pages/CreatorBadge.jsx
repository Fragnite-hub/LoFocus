import { useState } from "react";

export default function CreatorBadge({ onOpenContact }) {
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem("creatorExpanded") === "true"
  );

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem("creatorExpanded", String(next));
  };

  return (
    <div
      className="creatorDrawerBox"
      style={{
        position: "fixed",
        bottom: "58px",
        left: "16px",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: expanded ? "8px" : "0px",
        background: expanded ? "rgba(0,0,0,0.55)" : "transparent",
        padding: expanded ? "6px 14px 6px 6px" : "0px",
        borderRadius: "20px",
        border: expanded ? "1px solid rgba(255,255,255,0.1)" : "none",
        backdropFilter: expanded ? "blur(8px)" : "none",
        transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      {/* Collapse / Expand toggle */}
      <button
        onClick={toggle}
        onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        style={{
          background: expanded ? "transparent" : "rgba(255,255,255,0.08)",
          border: expanded ? "none" : "1px solid rgba(255,255,255,0.15)",
          backdropFilter: expanded ? "none" : "blur(12px)",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: "10px",
          width: expanded ? "18px" : "28px",
          height: expanded ? "18px" : "28px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
        title={expanded ? "Collapse" : "Connect"}
      >
        {expanded ? "❮" : "❯"}
      </button>

      {/* Expandable link */}
      <div
        style={{
          width: expanded ? "240px" : "0px",
          overflow: "hidden",
          transition: "width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
          whiteSpace: "nowrap",
        }}
      >
        <button
          onClick={onOpenContact}
          onMouseOver={(e) => (e.currentTarget.style.color = "white")}
          onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.8px",
            padding: 0,
            transition: "color 0.2s ease",
          }}
        >
          built by a fellow lofi lover · connect ↗
        </button>
      </div>
    </div>
  );
}
