import { useState, useEffect } from "react";
import MusicPlayer from "./MusicPlayer";
import SpotifyPlayer from "./SpotifyPlayer";
import { redirectToAuthCodeFlow, getAccessToken, redirectUri } from "../spotify";
import { useNavigate } from "react-router-dom";
import { showToast } from "../toast";

export default function PlayerManager({ playlist, hideOverlays }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // SYNCHRONOUSLY clear the URL to prevent React StrictMode from double-triggering auth!
        window.history.replaceState({}, document.title, window.location.pathname);

        getAccessToken(code).then(accessToken => {
          if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
            setToken(accessToken);
            localStorage.setItem("spotifyToken", accessToken);
            navigate("/", { replace: true });
            
            fetchUserDetails(accessToken);
          } else {
             showToast("No secure token returned. Connection reset.", "error");
             navigate("/", { replace: true });
          }
        }).catch(err => {
             showToast("Auth Error: " + err.message, "error");
             navigate("/", { replace: true });
        });
      } else {
        const _token = localStorage.getItem("spotifyToken");
        if (_token && _token !== "undefined" && _token !== "null") {
          setToken(_token);
          fetchUserDetails(_token);
        } else {
          localStorage.removeItem("spotifyToken");
        }
      }
    } catch(err) {
        console.error(err);
    }
  }, []);

  const fetchUserDetails = (accessToken) => {
    fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setIsPremium(data.product === "premium");
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem("spotifyToken");
      });
  };

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [modalState, setModalState] = useState("ask"); // "ask" | "free" | "custom"
  const [customClientId, setCustomClientId] = useState(localStorage.getItem("custom_spotify_client_id") || "");
  const [spotifyExpanded, setSpotifyExpanded] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return false; // collapsed on mobile
    return sessionStorage.getItem("spotifyExpanded") !== "false";
  });

  const saveCustomIdAndConnect = () => {
    if (!customClientId.trim()) {
      showToast("Please enter a Client ID", "error");
      return;
    }
    // Clear old state for a clean handshake
    localStorage.removeItem("spotifyToken");
    localStorage.removeItem("verifier");
    
    localStorage.setItem("custom_spotify_client_id", customClientId.trim());
    redirectToAuthCodeFlow();
  };

  const handleLogout = () => {
    localStorage.removeItem("spotifyToken");
    window.location.reload();
  };

  return (
    <>
      {!token ? (
        <>
          <MusicPlayer playlist={playlist} />
          
          {!hideOverlays && (
          <div className="spotifyDrawer spotifyDrawerBox" style={{
            position: "fixed",
            top: "14px",
            right: "18px",
            zIndex: 100,
            display: "flex",
            flexDirection: "row-reverse", // expand leftwards
            alignItems: "center",
            gap: spotifyExpanded ? "10px" : "0px",
            background: spotifyExpanded ? "#1DB954" : "rgba(0,0,0,0.55)",
            padding: spotifyExpanded ? "8px 14px 8px 8px" : "0px",
            borderRadius: "20px",
            border: spotifyExpanded ? "none" : "1px solid rgba(255,255,255,0.08)",
            backdropFilter: spotifyExpanded ? "none" : "blur(8px)",
            boxShadow: spotifyExpanded ? "0 4px 10px rgba(29, 185, 84, 0.4)" : "none",
            transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}>
            <button 
              onClick={() => { 
                const next = !spotifyExpanded;
                setSpotifyExpanded(next); 
                localStorage.setItem("spotifyExpanded", String(next)); 
              }}
              style={{ 
                background: spotifyExpanded ? "transparent" : "rgba(0,0,0,0.3)", 
                border: spotifyExpanded ? "none" : "1px solid rgba(255,255,255,0.06)",
                color: spotifyExpanded ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", 
                cursor: "pointer", 
                fontSize: "12px", 
                width: spotifyExpanded ? "22px" : "32px",
                height: spotifyExpanded ? "22px" : "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease" 
              }}
              onMouseOver={e => !spotifyExpanded && (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseOut={e => !spotifyExpanded && (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              title={spotifyExpanded ? "Collapse" : "Connect Spotify"}
            >
              {spotifyExpanded ? "❯" : "❮"}
            </button>

            <div style={{
              width: spotifyExpanded ? "135px" : "0px",
              overflow: "hidden",
              transition: "width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              flexDirection: "row-reverse"
            }}>
              {import.meta.env.VITE_SPOTIFY_CLIENT_ID === "PLACE_YOUR_CLIENT_ID_HERE" || !import.meta.env.VITE_SPOTIFY_CLIENT_ID ? (
                <button
                  onClick={() => showToast("Please add your Client ID into your .env file!", "error")}
                  style={{
                    background: "transparent",
                    color: "white",
                    padding: "0",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Missing ID ⚠️
                </button>
              ) : (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  style={{
                    background: "transparent",
                    color: "white",
                    padding: "0",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.5-1 .3-2.6-1.6-6-2-8.5-1.1-.4.2-.8-.1-1-.5s.1-.8.5-1c3-1 6.8-.5 9.7 1.3.4.2.5.6.3 1zm1.5-3.3c-.3.4-.8.5-1.2.3-3-1.9-7.6-2.5-10.4-1.4-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.3-1.3 8.3-.6 11.7 1.6.4.3.6.8.5 1.3zm.1-3.6C15.6 8.3 11 8.1 7.8 9.1c-.6.2-1.3-.1-1.5-.7-.2-.6.1-1.3.7-1.5 3.8-1.2 9-.9 13.1 1.5.6.3.8 1 .5 1.6-.3.5-1 .8-1.5.4z" />
                  </svg>
                  Connect Spotify
                </button>
              )}
            </div>
          </div>
          )}

          {showPremiumModal && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(3, 4, 15, 0.75)",
              backdropFilter: "blur(12px)",
              zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "fadeIn 0.2s ease"
            }}>
              <div style={{
                background: "linear-gradient(150deg, #121429 0%, #080914 100%)",
                border: "1px solid rgba(29, 185, 84, 0.3)",
                borderRadius: "24px",
                padding: "36px 32px",
                width: "420px",
                maxWidth: "92vw",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(29, 185, 84, 0.15)",
                color: "white",
                position: "relative",
                fontFamily: "'Outfit', sans-serif"
              }}>
                <button onClick={() => { setShowPremiumModal(false); setModalState("ask"); }} style={{
                  position: "absolute", top: "16px", right: "20px",
                  background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
                  fontSize: "18px", cursor: "pointer"
                }}>✕</button>

                {modalState === "ask" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1DB954", boxShadow: "0 0 10px #1DB954" }}></div>
                      <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>Spotify Connect</h2>
                    </div>
                    
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "32px", fontFamily: "'JetBrains Mono', monospace" }}>
                      To sync your music and control playback seamlessly on this dashboard, Spotify strictly requires an active <strong>Premium Account</strong>.
                    </p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <button onClick={() => redirectToAuthCodeFlow()} style={{
                        width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                        background: "#1DB954", color: "white", fontSize: "14px", fontWeight: "700",
                        cursor: "pointer", transition: "all 0.2s ease"
                      }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                        Yes, I have Spotify Premium
                      </button>

                      {/* Show setup guide only for new users who haven't registered an ID yet */}
                      {!localStorage.getItem("custom_spotify_client_id") && (
                        <button onClick={() => setModalState("custom")} style={{
                          width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)",
                          background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)", fontSize: "14px", fontWeight: "600",
                          cursor: "pointer", transition: "all 0.2s ease"
                        }} onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }} onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                          New User? / Setup Guide
                        </button>
                      )}

                      <button onClick={() => setModalState("free")} style={{
                        width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: "600",
                        cursor: "pointer", transition: "all 0.2s ease"
                      }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                        I am on the Free Tier
                      </button>
                    </div>

                    {localStorage.getItem("custom_spotify_client_id") && (
                      <div style={{ textAlign: "center", marginTop: "16px" }}>
                         <button onClick={() => setModalState("custom")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>Update Personal ID Settings</button>
                      </div>
                    )}
                  </>
                ) : modalState === "custom" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1DB954", boxShadow: "0 0 10px #1DB954" }}></div>
                      <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>Personal ID Setup</h2>
                    </div>
                    
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "20px", fontFamily: "'JetBrains Mono', monospace" }}>
                      To ensure unlimited, stable playback, we recommend connecting via a <strong>Personal ID</strong>. Setup is free, takes ~30s, and only required once.
                    </p>

                    <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "8px", marginBottom: "20px" }}>
                      {[
                        { step: 1, text: "Log in at", link: "https://developer.spotify.com", linkText: "Spotify for Developers", suffix: "." },
                        { step: 2, text: "Click your Profile Name (top right) and select 'Dashboard'." },
                        { step: 3, text: "Click 'Create app'. Use App name as 'LoFocus' (and same for Description) and add this Redirect URI:", isUri: true },
                        { step: 4, text: "Check 'Web API' & 'Agreement', click 'Create', then copy your 'Client ID' from Settings." }
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                          <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "rgba(29, 185, 84, 0.2)", color: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>{s.step}</span>
                          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                            {s.text} {s.link && <a href={s.link} target="_blank" rel="noreferrer" style={{ color: "#1DB954", textDecoration: "underline" }}>{s.linkText}</a>} {s.suffix}
                            {s.isUri && (
                              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <code style={{ fontSize: "11px", color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{redirectUri}</code>
                                <button onClick={() => { navigator.clipboard.writeText(redirectUri); showToast("Copied URI!", "success"); }} style={{ background: "rgba(29, 185, 84, 0.2)", color: "#1DB954", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>Copy</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "bold" }}>Paste Client ID</label>
                      <input 
                        type="text" 
                        value={customClientId}
                        onChange={e => setCustomClientId(e.target.value)}
                        placeholder="e.g. 7482bh3...f81"
                        style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => setModalState("ask")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", fontWeight: "600", cursor: "pointer" }}>Back</button>
                      <button onClick={saveCustomIdAndConnect} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "#1DB954", color: "white", fontWeight: "700", cursor: "pointer" }}>Apply & Connect</button>
                    </div>
                  </>
                ) : (
                  <>
                     <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                       <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1" }}></div>
                       <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>You're all set!</h2>
                     </div>
                     <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                       Spotify completely blocks third-party apps from streaming music for free users (to ensure you hear their native ads). 
                     </p>
                     <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6", marginBottom: "32px", fontWeight: "bold" }}>
                       But don't worry! We've deeply integrated an absolutely incredible, hand-curated Lofi mix straight into your dashboard. Just hit Play at the bottom of the screen and enjoy the vibes.
                     </p>
                     <button onClick={() => { 
                         setSpotifyExpanded(false);
                         sessionStorage.setItem("spotifyExpanded", "false");
                         setShowPremiumModal(false); 
                         setModalState("ask");
                     }} style={{
                         width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                         background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "white", fontSize: "14px", fontWeight: "700",
                         cursor: "pointer", transition: "all 0.2s ease"
                       }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                         Got it, let's focus! ✦
                     </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <SpotifyPlayer token={token} isPremium={isPremium} playlist={playlist} />
          <button
            onClick={() => {
              handleLogout();
              showToast("Securely disconnected from Spotify.", "success");
            }}
            className="spotifyLogoutBtn"
            style={{
              background: "rgba(0,0,0,0.6)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              zIndex: 100,
            }}
          >
            Disconnect {user?.display_name}
          </button>
        </>
      )}
    </>
  );
}
