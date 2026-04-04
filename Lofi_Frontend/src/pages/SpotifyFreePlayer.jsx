export default function SpotifyFreePlayer() {
  return (
    <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", width: "300px", zIndex: 10 }}>
      <iframe 
        style={{ borderRadius: "12px", border: "0", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} 
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0" 
        width="100%" 
        height="152" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
        loading="lazy"
      ></iframe>
    </div>
  );
}
