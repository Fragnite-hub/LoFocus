import { useEffect, useState } from "react";

export default function SpotifyPremiumPlayer({ token }) {
  const [player, setPlayer] = useState(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(null);

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
        // Automatically transfer Spotify playback to this Web Player!
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
    <div className="musicBar" style={{ "--vol": "0.5" }}>
      <button onClick={() => player?.togglePlay()}>
        {!is_paused ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <span className="trackName" style={{ marginLeft: "14px", fontWeight: "bold" }}>
        {current_track ? `${current_track.name} — ${current_track.artists[0].name}` : "Open Spotify on your phone & select this device"}
      </span>
    </div>
  );
}
