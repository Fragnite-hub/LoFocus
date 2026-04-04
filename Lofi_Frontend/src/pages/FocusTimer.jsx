import { useEffect, useState, useRef } from "react";
import { useSettings } from "../hooks/useSettings";
import SettingsModal from "./SettingsModal";

export default function FocusTimer({ onSessionComplete }) {
  const settings = useSettings();
  const DURATIONS = {
    pomodoro: settings.pomodoro * 60,
    short: settings.short * 60,
    long: settings.long * 60,
  };
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [mode, setMode] = useState("pomodoro");
  const [seconds, setSeconds] = useState(DURATIONS.pomodoro);
  const [running, setRunning] = useState(false);
  const [ringing, setRinging] = useState(false);
  const alarmRef = useRef(null);

  useEffect(() => {
    alarmRef.current = new Audio("/alarm/Bruh-2-chosic.com_.mp3");
    alarmRef.current.loop = true;
    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
    };
  }, []);

  const formatClock = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    if (!running) return;

    const t = setInterval(() => {
      setSeconds((s) => {
        if (s === 1) {
          if (mode === "pomodoro") onSessionComplete?.();
          setRunning(false);
          setRinging(true);
          alarmRef.current?.play().catch(e => console.error("Alarm blocked", e));
          return 0; // Stick at 0 while ringing
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [running, mode]);

  useEffect(() => {
    // When switching modes, reset and pause.
    setRunning(false);
    setSeconds(DURATIONS[mode]);
  }, [mode]);

  useEffect(() => {
    // When settings change natively via the global hook, magically sync the idle clock.
    if (!running) {
      setSeconds(DURATIONS[mode]);
    }
  }, [settings]);

  const onToggle = () => {
    if (ringing) {
      setRinging(false);
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      }
      setSeconds(DURATIONS[mode]);
      return;
    }
    setRunning((r) => !r);
  };

  return (
    <>
      <div className="timerHeader">
        <div className="timerKicker">Enjoy Your Space</div>
        <div className="timerModePills" role="tablist" aria-label="timer modes">
          <button
            className={"timerPill" + (mode === "pomodoro" ? " timerPillActive" : "")}
            onClick={() => setMode("pomodoro")}
            type="button"
          >
            pomodoro
          </button>
          <button
            className={"timerPill" + (mode === "short" ? " timerPillActive" : "")}
            onClick={() => setMode("short")}
            type="button"
          >
            short break
          </button>
          <button
            className={"timerPill" + (mode === "long" ? " timerPillActive" : "")}
            onClick={() => setMode("long")}
            type="button"
          >
            long break
          </button>
        </div>
      </div>

      <div className={"timerClock" + (running ? " timerClock--running" : "")}>
        {formatClock(seconds)}
      </div>

      <div className="timerActions">
        <button className="timerPrimaryBtn" onClick={onToggle} type="button">
          {ringing ? "Stop" : running ? "Pause" : "Start"}
        </button>
        <button
          className="timerIconBtn"
          onClick={() => {
            setRunning(false);
            if (ringing) {
              setRinging(false);
              if (alarmRef.current) {
                alarmRef.current.pause();
                alarmRef.current.currentTime = 0;
              }
            }
            setSeconds(DURATIONS[mode]);
          }}
          type="button"
          title="Reset"
        >
          C
        </button>
        <button className="timerIconBtn" onClick={() => setIsSettingsOpen(true)} type="button" title="Settings">
          ⚙
        </button>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
