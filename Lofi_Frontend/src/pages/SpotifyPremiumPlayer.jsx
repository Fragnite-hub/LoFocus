import { useEffect, useState } from "react";

export default function SpotifyPremiumPlayer({ token }) {
  const [player, setPlayer] = useState(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Lofi Productivity Web Player",
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false
          })
        }).catch(err => console.error("Could not transfer playback", err));
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        setTrack(state.track_window.current_track);
        setPaused(state.paused);
        player.getCurrentState().then(state => { setActive(!!state); });
      });

      player.connect();
    };

    return () => {
      if (player) {
         player.disconnect();
      }
    };
  }, [token]);

  return (
    <div className="musicBar" style={{ "--vol": Number(volume) }}>
      <button onClick={() => player?.togglePlay()} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.12)", color: "white", border: "1px solid rgba(255, 255, 255, 0.2)", cursor: "pointer", transition: "all 0.15s ease" }} onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"; }} onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; }}>
        {!is_paused ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <input
        className="volumeSlider"
        type="range"
        min="0" max="1" step="0.01"
        value={volume}
        onChange={(e) => {
          const v = Number(e.target.value);
          setVolume(v);
          if (player) {
            player.setVolume(v).catch(err => console.error("Volume tweak failed", err));
          }
        }}
        style={{ marginLeft: "14px" }}
      />

      <span className="trackName" style={{ marginLeft: "14px", fontWeight: "bold" }}>
        {current_track ? `${current_track.name} — ${current_track.artists[0].name}` : "Open Spotify on your phone & select this device"}
      </span>
    </div>
  );
}
