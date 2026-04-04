import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getSettings, saveSettings } from "../hooks/useSettings";

const AVAILABLE_BACKGROUNDS = [
  "Lofi Default.mp4",
  "Sunset.mp4",
  "Mario.mp4",
  "Minecraft.mp4",
  "Animals.mp4",
  "Batman.mp4",
  "Gaming Room.mp4",
  "Iron Man.mp4",
  "Knight.mp4",
  "SpiderMan.mp4"
];

export default function SettingsModal({ isOpen, onClose }) {
  // Local state for edits
  
  // Local state for edits
  const [pomodoro, setPomodoro] = useState(25);
  const [short, setShort] = useState(5);
  const [long, setLong] = useState(15);
  const [bg, setBg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const s = getSettings();
      setPomodoro(s.pomodoro);
      setShort(s.short);
      setLong(s.long);
      setBg(s.background.replace("/backgrounds/", ""));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSettings({
      pomodoro: pomodoro || 25,
      short: short || 5,
      long: long || 15,
      background: `/backgrounds/${bg}`
    });
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999, // Safely over FocusTimer's progress bar
        background: "rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "480px",
          height: "auto",
          maxHeight: "90vh",
          background: "#111111",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          position: "relative",
          color: "white",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Premium Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            borderRadius: "50%",
            transition: "all 0.2s ease"
          }}
          onMouseOver={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseOut={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Unified Content Area */}
        <div style={{ flex: 1, padding: "8px 16px", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
          
          {/* Timers Section */}
          <div style={{ paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
             <h3 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: "600", color: "white" }}>Focus Limits</h3>
             <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                   <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Pomodoro</label>
                   <input type="number" min="1" max="180" value={pomodoro} onChange={e => setPomodoro(Number(e.target.value))} style={{ width: "80px", background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "15px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                   <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Short Break</label>
                   <input type="number" min="1" max="60" value={short} onChange={e => setShort(Number(e.target.value))} style={{ width: "80px", background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "15px", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                   <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Long Break</label>
                   <input type="number" min="1" max="120" value={long} onChange={e => setLong(Number(e.target.value))} style={{ width: "80px", background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "15px", outline: "none" }} />
                </div>
             </div>
             <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.4", margin: 0 }}>
                Transitions to your scheduled breaks visually switch when the primary focus dial completes.
             </p>
          </div>

          {/* Backgrounds Section */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
             <h3 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: "600", color: "white" }}>Environment</h3>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingRight: "4px" }}>
               {AVAILABLE_BACKGROUNDS.map(fileName => (
                 <button 
                    key={fileName}
                    onClick={() => setBg(fileName)}
                    style={{ 
                       background: bg === fileName ? "white" : "#161616", 
                       color: bg === fileName ? "black" : "#aaa", 
                       border: "1px solid", 
                       borderColor: bg === fileName ? "white" : "#2a2a2a",
                       padding: "12px 14px", 
                       borderRadius: "10px", 
                       cursor: "pointer", 
                       fontSize: "13px",
                       fontWeight: "600",
                       textAlign: "left",
                       transition: "all 0.15s ease",
                       whiteSpace: "nowrap",
                       overflow: "hidden",
                       textOverflow: "ellipsis"
                    }}
                    onMouseOver={e => { if(bg !== fileName) e.currentTarget.style.borderColor = "#666"; }}
                    onMouseOut={e => { if(bg !== fileName) e.currentTarget.style.borderColor = "#2a2a2a"; }}
                  >
                   {fileName.replace(".mp4", "")}
                 </button>
               ))}
             </div>
          </div>


          <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => { setPomodoro(25); setShort(5); setLong(15); }} style={{ color: "#ff4d4f", background: "none", border: "none", fontSize: "14px", fontWeight: "500", padding: "0", cursor: "pointer", transition: "opacity 0.2s ease" }} onMouseOver={e => e.currentTarget.style.opacity="0.8"} onMouseOut={e => e.currentTarget.style.opacity="1"}>
              Reset timers
            </button>
            <div style={{ display: "flex", gap: "12px" }}>
               <button onClick={onClose} style={{ background: "#222", color: "white", padding: "10px 24px", borderRadius: "20px", border: "1px solid #333", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" }} onMouseOver={e => e.currentTarget.style.background="#333"} onMouseOut={e => e.currentTarget.style.background="#222"}>Close</button>
               <button onClick={handleSave} style={{ background: "white", color: "black", padding: "10px 24px", borderRadius: "20px", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,255,255,0.2)" }}>Save Changes</button>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
