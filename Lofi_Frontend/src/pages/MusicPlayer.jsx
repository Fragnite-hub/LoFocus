import { useRef, useState, useEffect } from "react";

export default function MusicPlayer({ playlist }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * playlist.length));
  const [playError, setPlayError] = useState("");

  // Auto-play immediately when the component mounts over the unlocked DOM
  // useEffect(() => {
  //   const el = audioRef.current;
  //   if (el) {
  //     el.volume = Number(volume);
  //     el.play().catch(e => {
  //       setPlaying(false);
  //       setPlayError("Tap play (browser blocked background autoplay).");
  //     });
  //   }
  // }, []);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    setPlayError("");
    try {
      if (playing) {
        el.pause();
        setPlaying(false);
        return;
      }
      el.volume = Number(volume);
      await el.play();
      setPlaying(true);
    } catch (e) {
      setPlaying(false);
      setPlayError("Tap play again (browser blocked autoplay).");
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={playlist[index]}
        autoPlay={playing}
        onEnded={() => {
          let nextIdx;
          if (playlist.length > 1) {
            do {
              nextIdx = Math.floor(Math.random() * playlist.length);
            } while (nextIdx === index);
          } else {
            nextIdx = 0;
          }
          setIndex(nextIdx);
        }}
        preload="metadata"
      />

      <div
        className={"musicBar" + (playing ? " musicBar--playing" : "")}
        style={{ "--vol": Number(volume) }}
      >
        <button onClick={togglePlay} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.12)", color: "white", border: "1px solid rgba(255, 255, 255, 0.2)", cursor: "pointer", transition: "all 0.15s ease" }} onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"; }} onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; }}>
          {playing ? (
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
            audioRef.current.volume = v;
          }}
        />

        <span className="trackName">
          Chillhop — relaxing beats 🎧
        </span>
      </div>

      {playError ? (
        <div style={{ position: "fixed", bottom: 62, left: "50%", transform: "translateX(-50%)", color: "white", opacity: 0.8, fontSize: 12 }}>
          {playError}
        </div>
      ) : null}
    </>
  );
}
