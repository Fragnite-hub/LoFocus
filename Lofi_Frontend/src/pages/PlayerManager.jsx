import { useState, useEffect } from "react";
import MusicPlayer from "./MusicPlayer";
import SpotifyPlayer from "./SpotifyPlayer";
import { redirectToAuthCodeFlow, getAccessToken } from "../spotify";
import { useNavigate } from "react-router-dom";
import { showToast } from "../toast";

export default function PlayerManager({ playlist }) {
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

  const handleLogout = () => {
    localStorage.removeItem("spotifyToken");
    window.location.reload();
  };

  return (
    <>
      {!token ? (
        <>
          <MusicPlayer playlist={playlist} />
          {import.meta.env.VITE_SPOTIFY_CLIENT_ID === "PLACE_YOUR_CLIENT_ID_HERE" || !import.meta.env.VITE_SPOTIFY_CLIENT_ID ? (
            <button
              onClick={() => showToast("Please add your Client ID into your .env file!", "error")}
              style={{
                position: "fixed",
                top: "14px",
                right: "18px",
                background: "#555",
                color: "white",
                padding: "8px 14px",
                borderRadius: "20px",
                border: "none",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 100,
              }}
            >
              Missing Client ID ⚠️
            </button>
          ) : (
            <button
              onClick={() => redirectToAuthCodeFlow()}
              style={{
                position: "fixed",
                top: "14px",
                right: "18px",
                background: "#1DB954",
                color: "white",
                padding: "8px 14px",
                borderRadius: "20px",
                border: "none",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(29, 185, 84, 0.4)",
                zIndex: 100,
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
        </>
      ) : (
        <>
          <SpotifyPlayer token={token} isPremium={isPremium} playlist={playlist} />
          <button
            onClick={() => {
              handleLogout();
              showToast("Securely disconnected from Spotify.", "success");
            }}
            style={{
              position: "fixed",
              top: "14px",
              right: "18px",
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
