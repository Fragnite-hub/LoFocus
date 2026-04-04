export default function ProgressCard({ completed, total, quote, onOpenNotes }) {
  const progress = total > 0 ? Math.min((completed / total) * 100, 100) : 0;

  return (
    <div className="progressWidget">
      <div className="barWrapper">
        <div className="bar" style={{ width: progress + "%" }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
        <p style={{ opacity: .95, margin: 0, fontWeight: 700, fontSize: '15px', textShadow: '0 4px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)' }}>
          {completed} / {total || 0} todos completed
        </p>
        <button 
          onClick={onOpenNotes}
          className="manageTodosBtn"
          title="Manage Todos"
          style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </button>
      </div>

      <p style={{ marginTop: 14, opacity: .8, fontStyle: 'italic', textShadow: '0 2px 8px rgba(0,0,0,0.8)', fontWeight: 500 }}>
        "{quote}"
      </p>
    </div>
  );
}
