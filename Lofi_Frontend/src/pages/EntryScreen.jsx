import { useState, useEffect } from "react";

export default function EntryScreen({ onEnter }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const handleInteract = () => {
      if (fading) return;
      setFading(true);
      setTimeout(() => {
        onEnter();
      }, 600); // Wait for CSS fade out
    };

    window.addEventListener("click", handleInteract);
    window.addEventListener("keydown", handleInteract);

    return () => {
      window.removeEventListener("click", handleInteract);
      window.removeEventListener("keydown", handleInteract);
    };
  }, [fading, onEnter]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(3, 7, 18, 0.90)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: fading ? "none" : "auto",
        userSelect: "none"
      }}
    >
      <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: fading ? "scale(1.05) translateY(-10px)" : "scale(1) translateY(0)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        <h1 style={{
            fontSize: "42px",
            fontWeight: "900",
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            textShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
            Lofi Productivity
        </h1>
        
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "10px 24px",
            borderRadius: "30px",
            animation: "pulseGlow 2.5s infinite"
        }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                <path d="M11 2v4c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm7.1 2.5c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l2.83 2.83c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-2.83-2.83zM22 11h-4c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1zm-3.49 6.09c-.39-.39-1.02-.39-1.41 0l-2.83 2.83c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l2.83-2.83c.39-.39.39-1.02 0-1.41zM11 22v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1zm-7.1-2.5c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-2.83-2.83c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l2.83 2.83zM2 13h4c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm3.49-6.09c.39.39 1.02.39 1.41 0l2.83-2.83c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0L3.49 5.5c-.39.39-.39 1.02 0 1.41z"/>
            </svg>
            <span style={{ fontSize: "15px", fontWeight: "600", letterSpacing: "0.04em" }}>Click anywhere to enter</span>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 15px rgba(255,255,255,0.05); transform: translateY(0); }
            50% { box-shadow: 0 0 25px rgba(255,255,255,0.15); transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
