import { useEffect, useMemo, useRef, useState } from "react";

// Use backend URL from ENV in production. In dev (empty string), it elegantly falls back to Vite's local proxy.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function fmt(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export default function NotesModal({ isOpen, onClose, onTodosChanged }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isNew, setIsNew] = useState(false);

  const textareaRef = useRef(null);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/todos?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch todos (${res.status})`);
      const data = await res.json();
      const todos = Array.isArray(data) ? data : [];
      setNotes(todos);
      const uncompleted = todos.filter(t => !t.completed);
      if (uncompleted.length > 0) {
        // If the selected id is no longer uncompleted, pick the first
        if (!selectedId || !uncompleted.find(t => t.id === selectedId)) {
          setSelectedId(uncompleted[0].id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      setError(e?.message ?? "Failed to fetch notes");
      setNotes([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    fetchNotes();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (isNew) return;
    if (!selected) {
      setDraftTitle("");
      setDraftContent("");
      return;
    }
    setDraftTitle(selected.title ?? "");
    setDraftContent(selected.content ?? "");
  }, [isOpen, isNew, selectedId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, draftTitle, draftContent, selectedId, isNew]);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [isOpen, selectedId, isNew]);

  function onNewNote() {
    setIsNew(true);
    setSelectedId(null);
    setDraftTitle("");
    setDraftContent("");
    setError("");
  }

  function onSelect(id) {
    setIsNew(false);
    setSelectedId(id);
    setError("");
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: (draftTitle || "Untitled").trim(),
        content: draftContent ?? "",
      };

      const isCreate = isNew || !selectedId;
      const url = isCreate
        ? `${API_BASE}/api/todos`
        : `${API_BASE}/api/todos/${selectedId}`;

      const res = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      const saved = await res.json();
      onTodosChanged?.();
      await fetchNotes();
      if (saved?.id) {
        setIsNew(false);
        setSelectedId(saved.id);
      }
    } catch (e) {
      setError(e?.message ?? "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedId || saving) return;
    const ok = window.confirm("Delete this note?");
    if (!ok) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/todos/${selectedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      onTodosChanged?.();
      await fetchNotes();
    } catch (e) {
      setError(e?.message ?? "Failed to delete note");
    } finally {
      setSaving(false);
    }
  }

  async function onComplete() {
    if (!selectedId || saving || !selected) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...selected, completed: true };
      const res = await fetch(`${API_BASE}/api/todos/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      onTodosChanged?.();
      
      setSelectedId(null);
      await fetchNotes();
    } catch (e) {
      setError(e?.message ?? "Failed to mark as complete");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const uncompletedNotes = notes.filter((n) => !n.completed);

  return (
    <div
      className="notesBackdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="notesModal">
        <div className="notesHeader">
          <div className="notesTitle">
            <span className="notesTitleIcon">📝</span>
            Notes
          </div>
          <div className="notesHeaderActions">
            <button
              className="notesBtn notesBtnGhost"
              onClick={onComplete}
              disabled={!selectedId || saving || loading || isNew}
            >
              ✓ Complete
            </button>
            <button className="notesBtn notesBtnGhost" onClick={onNewNote}>
              New
            </button>
            <button
              className="notesBtn"
              onClick={onSave}
              disabled={saving || loading}
              title="Ctrl/Cmd+S"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              className="notesBtn notesBtnDanger"
              onClick={onDelete}
              disabled={!selectedId || saving || loading}
            >
              Delete
            </button>
            <button className="notesBtn notesBtnGhost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="notesGrid">
          <div className="notesList">
            {loading ? (
              <div className="notesEmpty">Loading…</div>
            ) : uncompletedNotes.length === 0 ? (
              <div className="notesEmpty">
                No active todos. Click <b>New</b> to create one.
              </div>
            ) : (
              uncompletedNotes.map((n) => (
                <button
                  key={n.id}
                  className={
                    "notesItem" + (n.id === selectedId && !isNew ? " notesItemActive" : "")
                  }
                  onClick={() => onSelect(n.id)}
                >
                  <div className="notesItemTitle">{n.title || "Untitled"}</div>
                  <div className="notesItemMeta">{fmt(n.updatedAt || n.createdAt)}</div>
                </button>
              ))
            )}
          </div>

          <div className="notesEditor">
            <input
              className="notesInput"
              placeholder="Title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
            <textarea
              ref={textareaRef}
              className="notesTextarea"
              placeholder="Write your note…"
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
            />

            {error ? <div className="notesError">{error}</div> : null}
            {!error && (isNew || selected) ? (
              <div className="notesHint">
                Tip: Press <b>Esc</b> to close, <b>Ctrl/Cmd+S</b> to save.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

