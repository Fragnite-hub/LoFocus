import { useState, useEffect } from "react";

export default function BackgroundVideo({ src }) {
  const [isLoading, setIsLoading] = useState(true);

  // When the src prop changes explicitly, reset loading state to true
  useEffect(() => {
    setIsLoading(true);
  }, [src]);

  return (
    <>
      <video 
        key={src} 
        autoPlay 
        loop 
        muted 
        playsInline
        className="bgVideo"
        onCanPlay={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.8s ease" }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Elegant Spinner overlaid while loading */}
      {isLoading && (
        <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: -2, background: "black" }}>
           <div className="videoSpinner"></div>
        </div>
      )}
    </>
  );
}
