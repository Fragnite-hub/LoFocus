import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import BackgroundVideo from "./pages/BackgroundVideo";
import Home from "./pages/Home";
import StudyRoomCall from "./pages/StudyRoomCall";
import EntryScreen from "./pages/EntryScreen";
import PlayerManager from "./pages/PlayerManager";
import NotesModal from "./pages/NotesModal";
import ContactModal from "./pages/ContactModal";
import CreatorBadge from "./pages/CreatorBadge";
import { useSettings } from "./hooks/useSettings";

// ---------------------------------------------------------------------------
// Playlist — defined outside the component so it's never re-created on render
// ---------------------------------------------------------------------------
const PLAYLIST = [
  "/music/Hazelwood - At Ease (freetouse.com).mp3",
  "/music/Milky Wayvers - Love in Japan (freetouse.com).mp3",
  "/music/audiolibraryinfinite-echo-violin-418240.mp3",
  "/music/cfl_turningpages-guitar-rivalry-lofi-464428.mp3",
  "/music/cfl_turningpages-hearthside-not-lofi-406712.mp3",
  "/music/cfl_turningpages-woodwind-standstill-lofi-464427.mp3",
  "/music/chill_background-study-110111.mp3",
  "/music/fassounds-coding-night-112186.mp3",
  "/music/giorgiovitte-lofi-soulful-chill-trap-476605.mp3",
  "/music/koto-japan-soundtrack-softer-version-_-healing-anime-2-470664.mp3",
  "/music/lofium-lofi-song-room-by-lofium-242714.mp3",
  "/music/moonlight-lounge-sessions.mp3",
  "/music/rainy-afternoon-chords.mp3",
  "/music/romanbelov-spirit-blossom-15285.mp3",
  "/music/soft-notes-in-the-quiet.mp3",
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
  "/music/track12.mp3",
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const settings = useSettings();

  const [hasEntered, setHasEntered] = useState(
    () => sessionStorage.getItem("hasEntered") === "true"
  );
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Close notes modal when the todos modal fires its custom event
  useEffect(() => {
    const handleClose = () => setIsNotesOpen(false);
    window.addEventListener("todosModalClose", handleClose);
    return () => window.removeEventListener("todosModalClose", handleClose);
  }, []);

  const handleEnter = () => {
    setHasEntered(true);
    sessionStorage.setItem("hasEntered", "true");
  };

  const handleNotesChanged = () => {
    window.dispatchEvent(new Event("todosChanged"));
  };

  return (
    <BrowserRouter>
      {/* Always-visible background */}
      <BackgroundVideo src={settings.background} />

      {/* Always-visible navbar */}
      <nav className="navbar">
        <Link to="/">Home</Link>
        <Link to="/study">Study Room</Link>
      </nav>

      {/* Notes modal — always mounted so state persists across routes */}
      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onTodosChanged={handleNotesChanged}
      />

      {/* Entry overlay — blocks audio until the user interacts */}
      {!hasEntered && <EntryScreen onEnter={handleEnter} />}

      {/* Main content — fades in after entry */}
      <div style={{ opacity: hasEntered ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <Routes>
          <Route path="/"         element={<Home onOpenNotes={() => setIsNotesOpen(true)} />} />
          <Route path="/study"    element={<StudyRoomCall />} />
          <Route path="/callback" element={<Home onOpenNotes={() => setIsNotesOpen(true)} />} />
        </Routes>

        {hasEntered && (
          <PlayerManager playlist={PLAYLIST} hideOverlays={isNotesOpen} />
        )}

        {hasEntered && !isNotesOpen && (
          <CreatorBadge onOpenContact={() => setIsContactOpen(true)} />
        )}
      </div>

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </BrowserRouter>
  );
}
