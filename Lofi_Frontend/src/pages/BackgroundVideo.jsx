import { useState, useEffect, useRef } from "react";

const MOBILE_BG = "/backgrounds/SpiderMan.mp4"; // Fixed wallpaper for all mobile devices

const isMobile = () =>
  typeof window !== "undefined" &&
  (window.innerWidth < 900 || navigator.maxTouchPoints > 1);

export default function BackgroundVideo({ src }) {
  const [mobile, setMobile] = useState(isMobile());
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const check = () => setMobile(isMobile());
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // On mobile: always SpiderMan, ignore any user-selected background
  const activeSrc = mobile ? MOBILE_BG : src;

  useEffect(() => {
    setIsLoading(true);
    const el = videoRef.current;
    if (!el) return;
    el.load();
    el.play().catch(() => {});
  }, [activeSrc]);

  return (
    <>
      <video
        ref={videoRef}
        src={activeSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="bgVideo"
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1, transition: "opacity 0.8s ease" }}
      />

      {isLoading && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(135deg, #0a0a1a, #0d1b2a)" }}>
          <div className="loaderWrap" style={{ position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)" }}>
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
