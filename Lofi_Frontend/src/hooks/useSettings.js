import { useState, useEffect } from "react";

const SETTINGS_KEY = "lofi_settings";

const defaultSettings = {
  pomodoro: 25,
  short: 5,
  long: 15,
  background: "/backgrounds/Lofi Default.mp4"
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to parse settings", e);
  }
  return defaultSettings;
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("settingsChanged"));
}

export function useSettings() {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const handleSync = () => {
      setSettings(getSettings());
    };
    window.addEventListener("settingsChanged", handleSync);
    return () => window.removeEventListener("settingsChanged", handleSync);
  }, []);

  return settings;
}
