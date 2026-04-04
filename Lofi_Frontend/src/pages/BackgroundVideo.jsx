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
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.8s ease" }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Elegant Spinner overlaid while loading */}
      {isLoading && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "black" }}>
           <div style={{ position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)" }}>
             <div className="premiumLoader">
               <div className="premiumLoaderText">Tuning environment</div>
               <div className="premiumLoaderBar"></div>
             </div>
           </div>
        </div>
      )}
    </>
  );
}
