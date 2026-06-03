import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchLists, fetchMoviesInList, createList, deleteList, removeMovieFromList, getUserId } from "../../api/index";
import MovieCard from "../../components/shared/MovieCard";
import AddToListModal from "../../components/shared/AddToListModal";

if (typeof document !== "undefined" && !document.getElementById("maven-pro-font")) {
  const link = document.createElement("link");
  link.id = "maven-pro-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Maven+Pro:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
}

const C = {
  bg: "#140d0d",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
};

const SORT_OPTIONS = [
  { key: "popularity", label: "Popularidad" },
  { key: "year", label: "Año" },
  { key: "rating", label: "Rating" },
  { key: "alpha", label: "Alfabetico" },
  { key: "newest", label: "Nuevo" },
];

const MP = { fontFamily: "'Maven Pro', sans-serif" };

// ── Folder SVG ────────────────────────────────────────────────────────────────
function FolderIcon({ shared }) {
  return (
    <svg viewBox="0 0 64 52" fill="none" className="w-10 h-10">
      <rect x="0" y="10" width="64" height="40" rx="5" fill={shared ? "#b5a642" : "#b5853a"} />
      <path d="M0 10 Q0 6 4 6 L22 6 Q26 6 28 10 Z" fill={shared ? "#d4c24a" : "#d4a843"} />
      <rect x="0" y="14" width="64" height="36" rx="5" fill={shared ? "#e8d84e" : "#f0b84a"} />
      <rect x="6" y="19" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

// ── Folder Card ───────────────────────────────────────────────────────────────
function FolderCard({ list, isShared, isMenuOpen, onOpen, onToggleMenu, onDelete, onRename }) {
  return (
    <div className="relative flex-shrink-0 cursor-pointer group" style={{ width: 152, ...MP }} onClick={onOpen}>
      <div
        className="rounded-2xl px-3 pt-3 pb-2.5 flex flex-col gap-2 transition-transform duration-150 active:scale-95 group-hover:scale-[1.02]"
        style={{ background: isShared ? "#1e1f0f" : C.card, border: `1px solid ${isShared ? "#3a3a1a" : "#1e2d52"}` }}
      >
        <div className="flex items-start justify-between">
          <FolderIcon shared={isShared} />
          <button
            data-folder-menu
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(e);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.45)" }}
          >
            •••
          </button>
        </div>
        <div>
          <p className="text-sm leading-tight truncate" style={{ color: C.white, fontWeight: 600 }}>
            {list.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: C.gray }}>
            {list.movie_count ?? 0} títulos
          </p>
        </div>
      </div>
      {isMenuOpen && (
        <div
          data-folder-menu
          className="absolute right-0 top-2 z-30 rounded-xl shadow-2xl overflow-hidden min-w-[170px]"
          style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
            style={{ color: C.white, ...MP }}
          >
            Cambiar nombre
          </button>
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e);
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
            style={{ color: "#e05c5c", ...MP }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modal base ────────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl" style={{ background: "#151c2e", ...MP }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Type picker modal ─────────────────────────────────────────────────────────
function TypeModal({ current, onChange, onClose }) {
  function pick(val) {
    // si ya estaba activo, desactivar (volver a "all")
    onChange(current === val ? "all" : val);
    onClose();
  }

  const opts = [
    { key: "movie", label: "Movie" },
    { key: "tv", label: "Serie" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full sm:w-72 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl" style={{ background: "#151c2e", ...MP }} onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold mb-4" style={{ color: C.gray }}>
          Tipo
        </p>
        <div className="flex gap-3">
          {opts.map(({ key, label }) => {
            const active = current === key;
            return (
              <button
                key={key}
                onClick={() => pick(key)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? C.yellow : "rgba(255,255,255,0.06)",
                  color: active ? "#000" : C.white,
                  border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Lists() {
  const { user } = useAuth();
  const userId = getUserId(user);

  const [personal, setPersonal] = useState([]);
  const [shared, setShared] = useState([]);
  const [openList, setOpenList] = useState(null);
  const [movies, setMovies] = useState([]);
  const [sort, setSort] = useState({ field: null, asc: false });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListShared, setNewListShared] = useState(false);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [ruletaMovie, setRuletaMovie] = useState(null);
  const [openFolderMenu, setOpenFolderMenu] = useState(null);
  const [renameList, setRenameList] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "movie" | "tv"
  const [showTypeModal, setShowTypeModal] = useState(false);

  const sortMenuRef = useRef(null);

  useEffect(() => {
    if (userId) {
      const saved = sessionStorage.getItem("lists_open");
      if (saved) {
        sessionStorage.removeItem("lists_open");
        const list = JSON.parse(saved);
        load().then(() => handleOpenList(list));
      } else {
        load();
      }
    }
  }, [userId]);

  useEffect(() => {
    function h(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
      if (!e.target.closest("[data-folder-menu]")) setOpenFolderMenu(null);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function load() {
    try {
      const data = await fetchLists(userId);
      setPersonal(data?.personal ?? []);
      setShared(data?.shared ?? []);
    } catch {
      setPersonal([]);
      setShared([]);
    }
  }

  async function handleOpenList(list) {
    setOpenList(list);
    setSort({ field: null, asc: false });
    setTypeFilter("all");
    const data = await fetchMoviesInList(list.id);
    setMovies(data.map((m, i) => ({ ...m, originalIndex: i })));
  }

  function goBack() {
    setOpenList(null);
    setMovies([]);
  }

  async function handleDeleteList(e, listId) {
    e.stopPropagation();
    await deleteList(listId);
    setOpenFolderMenu(null);
    await load();
  }

  async function handleRemoveMovie(movieId) {
    await removeMovieFromList(openList.id, movieId);
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;
    await createList(newListName.trim(), userId, newListShared);
    setShowNewList(false);
    setNewListName("");
    setNewListShared(false);
    await load();
  }

  async function handleRenameList() {
    if (!renameName.trim() || !renameList) return;
    await fetch(`/api/lists/${renameList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    setRenameList(null);
    setRenameName("");
    await load();
  }

  function handleSort(field) {
    setSort((prev) => ({ field, asc: prev.field === field ? !prev.asc : false }));
    setShowSortMenu(false);
  }

  function spinRuleta() {
    if (!sortedMovies.length) return;
    setRuletaMovie(sortedMovies[Math.floor(Math.random() * sortedMovies.length)]);
  }

  const sortedMovies = useMemo(() => {
    let result = [...movies];

    // Filtrar por tipo
    if (typeFilter !== "all") {
      result = result.filter((m) => (m.media_type ?? m.type ?? "movie") === typeFilter);
    }

    // Ordenar
    if (sort.field) {
      result.sort((a, b) => {
        const dir = sort.asc ? 1 : -1;
        if (sort.field === "alpha") return dir * a.title.localeCompare(b.title);
        if (sort.field === "year") return dir * ((parseInt(a.year) || 0) - (parseInt(b.year) || 0));
        if (sort.field === "rating") return dir * ((parseFloat(a.imdb_rating) || 0) - (parseFloat(b.imdb_rating) || 0));
        if (sort.field === "popularity") return dir * (a.originalIndex - b.originalIndex);
        if (sort.field === "newest") return dir * (b.originalIndex - a.originalIndex);
        return 0;
      });
    }

    return result;
  }, [movies, sort, typeFilter]);

  const typeActive = typeFilter !== "all";
  const typeLabel = typeFilter === "movie" ? "Movie" : typeFilter === "tv" ? "Serie" : "Type";

  // ── Open list view ──────────────────────────────────────────────────────────
  if (openList) {
    return (
      <div className="min-h-screen" style={{ background: C.bg, ...MP }}>
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ background: C.bg, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={goBack} className="text-sm mb-3 block transition-opacity hover:opacity-70" style={{ color: C.gray }}>
            ← Listas
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.6rem", marginRight: 4 }}>{openList.name}</h2>

            {/* Ruleta */}
            <button
              onClick={spinRuleta}
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ background: "#0a5a5a", color: "#4de8e8", fontWeight: 600, ...MP }}
            >
              Ruleta
            </button>

            {/* Sort */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: C.yellow, color: "#000", ...MP }}
              >
                Sort
              </button>
              {showSortMenu && (
                <div
                  className="absolute left-0 top-9 rounded-xl shadow-2xl py-1 z-30 min-w-[180px]"
                  style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSort(key)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: sort.field === key ? C.yellow : C.white, ...MP, fontWeight: 500 }}
                    >
                      <span>{label}</span>
                      <span style={{ color: sort.field === key ? C.yellow : C.gray }}>{sort.field === key ? (sort.asc ? "↑" : "↓") : "↓↑"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type */}
            <button
              onClick={() => setShowTypeModal(true)}
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                background: typeActive ? C.yellow : "rgba(255,255,255,0.08)",
                color: typeActive ? "#000" : C.white,
                fontWeight: 600,
                ...MP,
              }}
            >
              {typeLabel}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {sortedMovies.length === 0 ? (
            <p className="text-center py-16 text-sm" style={{ color: C.gray }}>
              No hay títulos en esta lista
            </p>
          ) : (
            <>
              <div className="hidden sm:grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                {sortedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onDelete={() => handleRemoveMovie(movie.id)}
                    onAdd={() => {
                      const tmdbId = movie.imdb_id.replace("tmdb_", "");
                      setPendingMovie({
                        tmdb_id: tmdbId,
                        title: movie.title,
                        year: movie.year,
                        poster_url: movie.poster_url,
                        rating: movie.imdb_rating,
                        type: movie.media_type ?? "movie",
                      });
                    }}
                    onBeforeNavigate={() => {
                      sessionStorage.setItem("lists_open", JSON.stringify(openList));
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:hidden">
                {sortedMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    forceMobile
                    onDelete={() => handleRemoveMovie(movie.id)}
                    onAdd={() => {
                      const tmdbId = movie.imdb_id.replace("tmdb_", "");
                      setPendingMovie({
                        tmdb_id: tmdbId,
                        title: movie.title,
                        year: movie.year,
                        poster_url: movie.poster_url,
                        rating: movie.imdb_rating,
                        type: movie.media_type ?? "movie",
                      });
                    }}
                    onBeforeNavigate={() => {
                      sessionStorage.setItem("lists_open", JSON.stringify(openList));
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {pendingMovie && <AddToListModal movie={pendingMovie} onClose={() => setPendingMovie(null)} />}

        {showTypeModal && <TypeModal current={typeFilter} onChange={setTypeFilter} onClose={() => setShowTypeModal(false)} />}

        {/* Ruleta modal */}
        {ruletaMovie && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={() => setRuletaMovie(null)}>
            <div
              className="rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
              style={{ background: "#151c2e", ...MP }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: C.gray }}>
                Random 🎰
              </p>
              {ruletaMovie.poster_url && <img src={ruletaMovie.poster_url} alt={ruletaMovie.title} className="w-32 h-auto mx-auto rounded-xl shadow mb-4" />}
              <p style={{ color: C.white, fontWeight: 700, fontSize: "1.1rem" }}>{ruletaMovie.title}</p>
              <p className="text-sm mt-1" style={{ color: C.gray }}>
                {ruletaMovie.year}
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setRuletaMovie(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.06)", color: C.white }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const id = ruletaMovie.imdb_id?.replace("tmdb_", "") ?? ruletaMovie.tmdb_id;
                    const t = ruletaMovie.media_type ?? "movie";
                    window.location.href = `/peliculas/movie/${id}?type=${t}`;
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: C.yellow, color: "#000" }}
                >
                  Ver →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Folders view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 pt-6 pb-32 sm:pb-8" style={{ background: C.bg, ...MP }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <div style={{ color: C.yellow, fontWeight: 800, fontSize: "2rem", lineHeight: 1 }}>Listas</div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: "1.6rem", lineHeight: 1.3, marginTop: 4 }}>Personalessssss</div>
          </div>
          <button
            onClick={() => setShowNewList(true)}
            className="hidden sm:flex items-center gap-1 px-5 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: C.yellow, color: "#000", ...MP }}
          >
            Nueva +
          </button>
          <button
            onClick={() => setShowNewList(true)}
            className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold hover:opacity-90 transition-opacity"
            style={{ background: C.yellow, color: "#000" }}
          >
            +
          </button>
        </div>

        {/* Personal */}
        {personal.length === 0 ? (
          <p className="text-sm mb-8" style={{ color: C.gray }}>
            No tenés listas todavía
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 mb-8 sm:flex-wrap sm:overflow-visible" style={{ scrollbarWidth: "none" }}>
            {personal.map((list) => (
              <FolderCard
                key={list.id}
                list={list}
                isShared={false}
                isMenuOpen={openFolderMenu === list.id}
                onOpen={() => handleOpenList({ id: list.id, name: list.name, isShared: false })}
                onToggleMenu={(e) => {
                  e.stopPropagation();
                  setOpenFolderMenu((p) => (p === list.id ? null : list.id));
                }}
                onDelete={(e) => handleDeleteList(e, list.id)}
                onRename={() => {
                  setRenameList(list);
                  setRenameName(list.name);
                  setOpenFolderMenu(null);
                }}
              />
            ))}
          </div>
        )}

        {/* Shared */}
        {shared.length > 0 && (
          <>
            <div style={{ color: C.white, fontWeight: 700, fontSize: "1.6rem", marginBottom: 12 }}>Compartidas</div>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible" style={{ scrollbarWidth: "none" }}>
              {shared.map((list) => (
                <FolderCard
                  key={list.id}
                  list={list}
                  isShared
                  isMenuOpen={openFolderMenu === list.id}
                  onOpen={() => handleOpenList({ id: list.id, name: list.name, isShared: true })}
                  onToggleMenu={(e) => {
                    e.stopPropagation();
                    setOpenFolderMenu((p) => (p === list.id ? null : list.id));
                  }}
                  onDelete={(e) => handleDeleteList(e, list.id)}
                  onRename={() => {
                    setRenameList(list);
                    setRenameName(list.name);
                    setOpenFolderMenu(null);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* New list modal */}
      {showNewList && (
        <Modal onClose={() => setShowNewList(false)}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: "1.1rem", marginBottom: 16 }}>Nueva lista</div>
          <input
            autoFocus
            type="text"
            placeholder="Nombre de la lista"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.white, ...MP }}
          />
          <label className="flex items-center gap-3 text-sm mb-6 cursor-pointer" style={{ color: C.gray }}>
            <input type="checkbox" checked={newListShared} onChange={(e) => setNewListShared(e.target.checked)} className="w-4 h-4" />
            Lista compartida
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewList(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: C.white }}
            >
              Cancelar
            </button>
            <button onClick={handleCreateList} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: C.yellow, color: "#000" }}>
              Crear
            </button>
          </div>
        </Modal>
      )}

      {/* Rename modal */}
      {renameList && (
        <Modal onClose={() => setRenameList(null)}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: "1.1rem", marginBottom: 16 }}>Cambiar nombre</div>
          <input
            autoFocus
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameList()}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.white, ...MP }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setRenameList(null)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: C.white }}
            >
              Cancelar
            </button>
            <button onClick={handleRenameList} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: C.yellow, color: "#000" }}>
              Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
