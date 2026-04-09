/**
 * Returns a persistent anonymous client ID stored in localStorage.
 * Each browser / device gets its own unique ID so todos are never
 * shared across different people. Two tabs in the same browser
 * intentionally share the same ID (they're the same user).
 */
export function getClientId() {
  let id = localStorage.getItem("lofocus_client_id");
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("lofocus_client_id", id);
  }
  return id;
}
