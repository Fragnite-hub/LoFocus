import { useEffect, useState } from "react";

// BackgroundVideo removed (handled globally by App.jsx)
import TopControls from "./TopControls";
import FocusTimer from "./FocusTimer";
import ProgressCard from "./ProgressCard";

// Use backend URL from ENV in production. In dev (empty string), it elegantly falls back to Vite's local proxy.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Home({ onOpenNotes }) {
  const [todosTotal, setTodosTotal] = useState(0);
  const [todosCompleted, setTodosCompleted] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const quotes = [
    "Small progress is still progress.",
    "Focus on consistency, not intensity.",
    "Your future self will thank you.",
  ];
  const [q, setQ] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQ((i) => (i + 1) % quotes.length), 45000);
    return () => clearInterval(t);
  }, []);

  const saveSession = () => {
    // Keep focus timer localstorage if they want, but it doesn't affect the bar anymore
    const stored = JSON.parse(localStorage.getItem("sessions") || "[]");
    stored.push({ minutes: 25, time: new Date().toISOString() });
    localStorage.setItem("sessions", JSON.stringify(stored));
  };

  const checkCompletionAndReset = (data) => {
    if (!Array.isArray(data)) return;
    const total = data.length;
    const completedList = data.filter(t => t.completed);
    
    setTodosTotal(total);
    setTodosCompleted(completedList.length);

    if (total > 0 && completedList.length === total) {
      setShowCelebration(true);
      // Run deletions in background
      Promise.all(completedList.map(t => 
        fetch(`${API_BASE}/api/todos/${t.id}`, { method: 'DELETE' })
      )).then(() => {
        setTimeout(() => {
          setShowCelebration(false);
          fetchTodos(true); 
          window.dispatchEvent(new Event("todosModalClose"));
        }, 3000);
      });
    }
  };

  const fetchTodos = (skipCheck = false) => {
    // Prevent fetching if currently celebrating to avoid visual blips
    fetch(`${API_BASE}/api/todos?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!skipCheck) {
           checkCompletionAndReset(data);
        } else {
           setTodosTotal(Array.isArray(data) ? data.length : 0);
           setTodosCompleted(Array.isArray(data) ? data.filter(t => t.completed).length : 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTodos();
    const handleChanged = () => fetchTodos(false);
    window.addEventListener("todosChanged", handleChanged);
    return () => window.removeEventListener("todosChanged", handleChanged);
  }, []);

  return (
    <>
      {showCelebration && (
        <div className="celebrationOverlay">
          <h1>🏆 Well done champ! 🏆</h1>
          <p>All tasks completed. Resetting...</p>
        </div>
      )}

      <TopControls />

      <div className="homePage">
        <div className="homeLayout">
          <div className="glassCard timerCard">
            <FocusTimer onSessionComplete={saveSession} />
          </div>
          <div className="glassCard">
            <ProgressCard
              completed={todosCompleted}
              total={todosTotal}
              quote={quotes[q]}
              onOpenNotes={onOpenNotes}
            />
          </div>
        </div>
      </div>
    </>
  );
}
