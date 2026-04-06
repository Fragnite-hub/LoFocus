import { useState, useEffect } from "react";

export default function SpotifyFreePlayer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 150);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(400px, 92vw)",
      height: "80px",
      background: "rgba(0,0,0,0.85)",
      borderRadius: "16px",
      overflow: "hidden",
      zIndex: 80,
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      transition: "opacity 0.3s ease",
      opacity: show ? 1 : 0
    }}>
      <iframe 
        style={{ borderRadius: '16px', border: 'none' }} 
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0" 
        width="100%" 
        height="100%" 
        title="Spotify Free Player"
        allowFullScreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
      ></iframe>
    </div>
  );
}
