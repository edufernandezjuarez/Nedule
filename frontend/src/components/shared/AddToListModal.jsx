import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchLists, addMovieToList, getUserId } from "../../api/index";

const C = {
  bg: "#151c2e",
  card: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  accent: "#378add",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

export default function AddToListModal({ movie, onClose }) {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  // Set of listIds that already contain this movie
  const [inLists, setInLists] = useState(new Set());
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    const userId = getUserId(user);
    async function load() {
      // Fetch all lists
      const data = await fetchLists(userId);
      const all = [...(data.personal ?? []), ...(data.shared ?? [])];
      setLists(all);

      // Check which lists already contain this movie
      // We rely on /api/movies/:listId returning the movies per list
      // and checking if any has imdb_id === 'tmdb_' + movie.tmdb_id
      const tmdbKey = `tmdb_${movie.tmdb_id}`;
      const checks = await Promise.all(
        all.map(async (list) => {
          try {
            const res = await fetch(`/api/movies/${list.id}`);
            const movs = await res.json();
            const has = Array.isArray(movs) && movs.some((m) => m.imdb_id === tmdbKey);
            return has ? list.id : null;
          } catch {
            return null;
          }
        }),
      );
      setInLists(new Set(checks.filter(Boolean)));
      setLoading(false);
    }
    load();
  }, [user, movie.tmdb_id]);

  async function handleAdd(listId) {
    if (inLists.has(listId)) return; // ya está
    const userId = getUserId(user);
    await addMovieToList(listId, movie, userId);
    setInLists((prev) => new Set([...prev, listId]));
    setJustAdded(listId);
    setTimeout(onClose, 700);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl max-h-[70vh] flex flex-col shadow-2xl"
        style={{ background: C.bg, ...MP }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: C.white, fontWeight: 700, fontSize: "1rem" }}>Agregar a lista</span>
          <button onClick={onClose} className="text-xl leading-none hover:opacity-70 transition-opacity" style={{ color: C.gray }}>
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading ? (
            <p className="text-sm px-2 py-4" style={{ color: C.gray }}>
              Cargando…
            </p>
          ) : lists.length === 0 ? (
            <p className="text-sm px-2 py-4" style={{ color: C.gray }}>
              No tenés listas todavía
            </p>
          ) : (
            lists.map((list) => {
              const already = inLists.has(list.id);
              const added = justAdded === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => handleAdd(list.id)}
                  disabled={already}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors"
                  style={{
                    background: already ? "rgba(55,138,221,0.08)" : "transparent",
                    cursor: already ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!already) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = already ? "rgba(55,138,221,0.08)" : "transparent";
                  }}
                >
                  {/* Checkbox */}
                  <span
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: already ? `2px solid ${C.accent}` : "2px solid rgba(255,255,255,0.2)",
                      background: already ? C.accent : "transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {already && (
                      <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                        <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>

                  {/* Name */}
                  <span className="flex-1 text-sm" style={{ color: already ? C.accent : C.white, fontWeight: already ? 600 : 500 }}>
                    {list.name}
                  </span>

                  {/* Shared badge */}
                  {list.is_shared && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(55,138,221,0.12)", color: C.accent }}>
                      Compartida
                    </span>
                  )}

                  {/* Just added checkmark */}
                  {added && <span style={{ color: C.accent }}>✓</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
