import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import "./StudyRoomCall.css";

const isMobile = () =>
  typeof window !== "undefined" && (window.innerWidth < 768 || navigator.maxTouchPoints > 1);

export default function StudyRoomCall() {
  const navigate = useNavigate();
  const [mobileLayout, setMobileLayout] = useState(isMobile);

  const {
    connected, phase, room, codeInput, setCodeInput,
    copied, error, callError, micOn, camOn, screenOn,
    localVideoRef, remoteVideoRef, remoteStreamRef,
    username,
    handleCreate, handleJoin, stopCall, copyCode,
    toggleMic, toggleCam, toggleScreen,
  } = useWebRTC();

  useEffect(() => {
    const check = () => setMobileLayout(isMobile());
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Callback ref — ensures srcObject is assigned even if ontrack fired before mount
  const remoteRef = el => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) el.srcObject = remoteStreamRef.current;
  };

  // ── In-room view ──────────────────────────────────────────────────────────
  if (room) {
    return (
      <div className="src-room">
        {/* Header */}
        <div className="src-room-header">
          <div className="src-room-left">
            <div className="src-live-dot" />
            <span className="src-room-name">Study Room</span>
            <span className="src-room-badge">{room.code}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="src-share-code-btn" onClick={copyCode}>
              {copied ? "✓ copied!" : "share code"}
            </button>
            <button className="src-leave-btn" onClick={stopCall}>Leave</button>
          </div>
        </div>

        {/* Waiting for partner */}
        {phase === "waiting" && (
          <div className="src-room-wait">
            <div className="src-room-wait-icon">👥</div>
            <div className="src-room-code-large">{room.code}</div>
            <div className="src-room-wait-text">share this code — waiting for your study buddy…</div>
          </div>
        )}

        {/* Call — mobile: WhatsApp style / desktop: side-by-side */}
        {phase === "call" && (
          mobileLayout ? (
            <div className="src-videos-mobile">
              <div className="src-vtile-remote-full">
                <video ref={remoteRef} autoPlay playsInline />
                <div className="src-vtile-label">Partner</div>
              </div>
              <div className="src-vtile-pip">
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="src-vtile-label">You</div>
                {!micOn && <div className="src-mute-badge">🔇</div>}
              </div>
            </div>
          ) : (
            <div className="src-videos src-videos--2">
              <div className={`src-vtile${screenOn ? " src-vtile--screen" : ""}`}>
                {screenOn && <div className="src-screen-badge">SCREEN</div>}
                <video ref={localVideoRef} autoPlay muted playsInline />
                <div className="src-vtile-label">You ({username})</div>
                {!micOn && <div className="src-mute-badge">🔇</div>}
              </div>
              <div className="src-vtile">
                <video ref={remoteRef} autoPlay playsInline />
                <div className="src-vtile-label">Partner</div>
              </div>
            </div>
          )
        )}

        {callError && <div className="src-room-error">{callError}</div>}

        {/* Controls */}
        <div className="src-controls">
          <button className={`src-ctrl${!micOn ? " src-ctrl--off" : ""}`} onClick={toggleMic} title="Mic">
            {micOn ? "🎙" : "🔇"}
          </button>
          <button className={`src-ctrl${!camOn ? " src-ctrl--off" : ""}`} onClick={toggleCam} title="Camera">
            {camOn ? "📷" : "🚫"}
          </button>
          <button className={`src-ctrl${screenOn ? " src-ctrl--active" : ""}`} onClick={toggleScreen} title="Screen share">
            🖥
          </button>
          <button className="src-ctrl src-ctrl--end" onClick={stopCall} title="Leave call">
            📞
          </button>
        </div>
      </div>
    );
  }

  // ── Lobby view ────────────────────────────────────────────────────────────
  return (
    <div className="src-room-page">
      <div className="src-lobby">
        <button className="src-close-btn" onClick={() => navigate("/")}>✕</button>

        <p className="src-eyebrow">lofi study</p>
        <h2 className="src-heading">Study Room</h2>
        <p className="src-sub">study together · stay focused · no distractions</p>

        {!connected && (
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 16, marginTop: 0 }}>
            ⟳ connecting…
          </p>
        )}

        {phase === "pick" && (
          <>
            <div className="src-tabs">
              <button className="src-tab" onClick={handleCreate}>✦ Create Room</button>
              <button className="src-tab src-tab--active" style={{ cursor: "default" }}>→ Join Room</button>
            </div>
            <div className="src-field-wrap">
              <div className="src-field-label">Room Code</div>
              <input
                className="src-field"
                placeholder="e.g. AB3X9KF2"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                maxLength={8}
              />
            </div>
            {error && <p className="src-error">{error}</p>}
            <button className="src-btn" onClick={handleJoin} disabled={!codeInput.trim()}>
              Join via Code
            </button>
          </>
        )}

        {phase === "waiting" && (
          <div className="src-waiting">
            <div className="src-pulse-ring">⏳</div>
            <p className="src-waiting-title">Setting up your room…</p>
            <p className="src-waiting-sub">connecting to server</p>
          </div>
        )}
      </div>
    </div>
  );
}
