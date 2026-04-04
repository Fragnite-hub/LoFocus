import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import BackgroundVideo from "./pages/BackgroundVideo";
import Home from "./pages/Home";
import StudyRoomCall from "./pages/StudyRoomCall";
import NotesModal from "./pages/NotesModal";
import { useState, useEffect } from "react";
import PlayerManager from "./pages/PlayerManager";
import EntryScreen from "./pages/EntryScreen";
import { useSettings } from "./hooks/useSettings";

export default function App() {
  const settings = useSettings();
  const [hasEntered, setHasEntered] = useState(() => sessionStorage.getItem("hasEntered") === "true");
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [creatorExpanded, setCreatorExpanded] = useState(() => localStorage.getItem("creatorExpanded") !== "false");
  const playlist = [
    "/music/track1.mp3",
    "/music/track2.mp3",
    "/music/track3.mp3",
    "/music/track4.mp3",
    "/music/track6.mp3",
    "/music/track7.mp3",
    "/music/track8.mp3",
    "/music/track9.mp3",
    "/music/track10.mp3",
    "/music/track11.mp3",
    "/music/track12.mp3"
  ];

  useEffect(() => {
    const handleClose = () => setIsNotesOpen(false);
    window.addEventListener("todosModalClose", handleClose);
    return () => window.removeEventListener("todosModalClose", handleClose);
  }, []);

  return (
    <BrowserRouter>

      {/* 🔹 Always-visible background */}
      <BackgroundVideo src={settings.background} />

      {/* 🔹 Always-visible navbar */}
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/study">Study Room</Link>
      </nav>

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onTodosChanged={() => window.dispatchEvent(new Event("todosChanged"))}
      />

      {/* 🔹 Entry Overlay blocks audio init and collects the gesture */}
      {!hasEntered && <EntryScreen onEnter={() => { setHasEntered(true); sessionStorage.setItem("hasEntered", "true"); }} />}

      {/* 🔹 Foreground content */}
      <div style={{ opacity: hasEntered ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <Routes>
          <Route path="/" element={<Home onOpenNotes={() => setIsNotesOpen(true)} />} />
          <Route path="/study" element={<StudyRoomCall />} />
          <Route path="/callback" element={<Home onOpenNotes={() => setIsNotesOpen(true)} />} />
        </Routes>

        {hasEntered && <PlayerManager playlist={playlist} />}

        {/* 🔹 Collapsible Creator Drawer */}
        {hasEntered && (
          <div style={{ 
            position: "fixed", 
            bottom: "16px", 
            left: "24px", 
            zIndex: 90, 
            display: "flex", 
            alignItems: "center", 
            gap: creatorExpanded ? "10px" : "0px",
            background: creatorExpanded ? "rgba(0,0,0,0.55)" : "transparent",
            padding: creatorExpanded ? "6px 14px 6px 6px" : "0px",
            borderRadius: "20px",
            border: creatorExpanded ? "1px solid rgba(255,255,255,0.08)" : "none",
            backdropFilter: creatorExpanded ? "blur(8px)" : "none",
            transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)"
          }}>
            <button 
              onClick={() => { 
                const next = !creatorExpanded;
                setCreatorExpanded(next); 
                localStorage.setItem("creatorExpanded", String(next)); 
              }}
              style={{ 
                background: creatorExpanded ? "transparent" : "rgba(0,0,0,0.3)", 
                border: creatorExpanded ? "none" : "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)", 
                cursor: "pointer", 
                fontSize: "10px", 
                width: creatorExpanded ? "22px" : "32px",
                height: creatorExpanded ? "22px" : "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease" 
              }}
              onMouseOver={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
              onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
              title={creatorExpanded ? "Collapse" : "Built by Prayag"}
            >
              {creatorExpanded ? "❮" : "❯"}
            </button>

            <div style={{
              width: creatorExpanded ? "240px" : "0px",
              overflow: "hidden",
              transition: "width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center"
            }}>
              <a
                href="https://linkedin.com/in/prayag23" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  color: "rgba(255, 255, 255, 0.45)",
                  textDecoration: "none",
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "1px",
                  transition: "all 0.3s ease",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)"
                }}
                onMouseOver={e => { e.currentTarget.style.color = "white"; }}
                onMouseOut={e => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)"; }}
              >
                 built by prayag. let's connect ↗
              </a>
            </div>
          </div>
        )}
      </div>

    </BrowserRouter>
  );
}
