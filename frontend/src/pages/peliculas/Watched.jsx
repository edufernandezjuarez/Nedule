import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchWatched, unmarkWatched, deleteProgress, getUserId } from "../../api/index";
import { useSearchParams } from "react-router-dom";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

const SORT_OPTIONS = [
  { key: "newest", label: "Reciente" },
  { key: "alpha", label: "Alfabético" },
  { key: "year", label: "Año" },
  { key: "rating", label: "Rating" },
];

function Stars({ rating }) {
  if (!rating) return null;
  return (
    <span style={{ fontSize: 11 }}>
      {"★".repeat(rating)}
      <span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(10 - rating)}</span>
      <span style={{ color: C.gray, fontSize: 10, marginLeft: 3 }}>{rating}/10</span>
    </span>
  );
}

function TypeModal({ current, onChange, onClose }) {
  function pick(val) {
    onChange(current === val ? "all" : val);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full sm:w-72 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl" style={{ background: "#151c2e", ...MP }} onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold mb-4" style={{ color: C.gray }}>
          Tipo
        </p>
        <div className="flex gap-3">
          {[
            { key: "movie", label: "Película" },
            { key: "tv", label: "Serie" },
          ].map(({ key, label }) => {
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

export default function Watched() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramUserId = searchParams.get("userId");
  const userId = paramUserId ? parseInt(paramUserId) : getUserId(user);
  const USER_NAMES = { 1: "Edu", 2: "Nicole" };
  const isOwnProfile = !paramUserId;
  const viewedUserName = paramUserId ? USER_NAMES[parseInt(paramUserId)] : user;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ field: "newest", asc: false });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTypeModal, setShowTypeModal] = useState(false);

  const sortMenuRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, []);

  useEffect(() => {
    function h(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSortMenu(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function load() {
    const data = await fetchWatched(userId);
    setItems(data);
    setLoading(false);
  }

  async function handleUnwatch(tmdbId, mediaType) {
    if (mediaType === "tv") {
      await deleteProgress(tmdbId, userId);
    } else {
      await unmarkWatched(userId, tmdbId);
    }
    setItems((prev) => prev.filter((i) => i.imdb_id !== `tmdb_${tmdbId}`));
  }

  function handleSort(field) {
    setSort((prev) => ({ field, asc: prev.field === field ? !prev.asc : false }));
    setShowSortMenu(false);
  }

  const sorted = useMemo(() => {
    let result = [...items];
    if (typeFilter !== "all") {
      result = result.filter((i) => (i.media_type ?? "movie") === typeFilter);
    }
    if (sort.field) {
      result.sort((a, b) => {
        const dir = sort.asc ? 1 : -1;
        if (sort.field === "alpha") return dir * a.title.localeCompare(b.title);
        if (sort.field === "year") return dir * ((parseInt(a.year) || 0) - (parseInt(b.year) || 0));
        if (sort.field === "rating") return dir * ((parseFloat(a.user_rating) || 0) - (parseFloat(b.user_rating) || 0));
        if (sort.field === "newest") {
          return sort.asc
            ? new Date(a.watched_at) - new Date(b.watched_at) // ↑ más antiguo primero
            : new Date(b.watched_at) - new Date(a.watched_at); // ↓ más reciente primero
        }
        return 0;
      });
    }
    return result;
  }, [items, sort, typeFilter]);

  const typeActive = typeFilter !== "all";
  const typeLabel = typeFilter === "movie" ? "Película" : typeFilter === "tv" ? "Serie" : "Tipo";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "24px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ color: C.yellow, fontWeight: 800, fontSize: "2rem" }}>{isOwnProfile ? "Vistos" : `Vistos de ${viewedUserName}`}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Sort */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                style={{
                  background: C.yellow,
                  color: "#000",
                  border: "none",
                  borderRadius: 20,
                  padding: "6px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  ...MP,
                }}
              >
                Sort
              </button>
              {showSortMenu && (
                <div
                  className="absolute right-0 top-9 rounded-xl shadow-2xl py-1 z-30 min-w-[180px]"
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
              style={{
                background: typeActive ? C.yellow : "rgba(255,255,255,0.08)",
                color: typeActive ? "#000" : C.white,
                border: "none",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                ...MP,
              }}
            >
              {typeLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: "0 16px" }}>
        {sorted.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "48px 0" }}>
            {typeFilter === "all" ? "No hay títulos vistos todavía" : "No hay títulos en esta categoría"}
          </p>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 16 }}>
              {sorted.map((item) => {
                const tmdbId = item.imdb_id.replace("tmdb_", "");
                const type = item.media_type ?? "movie";
                return (
                  <div
                    key={item.movie_id}
                    style={{ position: "relative", cursor: "pointer" }}
                    onClick={() => navigate(`/peliculas/${type === "tv" ? "tv" : "movie"}/${tmdbId}`)}
                  >
                    <img
                      src={item.poster_url ?? ""}
                      alt={item.title}
                      style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 12, display: "block", background: C.card }}
                    />
                    {item.user_rating && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 28,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                          padding: "16px 6px 4px",
                          borderRadius: "0 0 12px 12px",
                          textAlign: "center",
                        }}
                      >
                        <Stars rating={item.user_rating} />
                      </div>
                    )}
                    <p
                      style={{
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 600,
                        marginTop: 6,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    <p style={{ color: C.gray, fontSize: 10, margin: "2px 0 0" }}>{item.year}</p>
                  </div>
                );
              })}
            </div>

            {/* Mobile lista */}
            <div className="flex flex-col sm:hidden" style={{ gap: 10 }}>
              {sorted.map((item) => {
                const tmdbId = item.imdb_id.replace("tmdb_", "");
                const type = item.media_type ?? "movie";
                return (
                  <div
                    key={item.movie_id}
                    onClick={() => navigate(`/peliculas/${type === "tv" ? "tv" : "movie"}/${tmdbId}`)}
                    style={{
                      display: "flex",
                      gap: 12,
                      background: C.card,
                      borderRadius: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={item.poster_url ?? ""}
                      alt={item.title}
                      style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#1e2a4a" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: C.white,
                          fontWeight: 600,
                          fontSize: 13,
                          margin: "0 0 3px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </p>
                      <p style={{ color: C.gray, fontSize: 11, margin: "0 0 4px" }}>
                        {item.year} · {type === "tv" ? "Serie" : "Película"}
                      </p>
                      {item.user_rating && (
                        <p style={{ color: C.yellow, margin: 0 }}>
                          <Stars rating={item.user_rating} />
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showTypeModal && <TypeModal current={typeFilter} onChange={setTypeFilter} onClose={() => setShowTypeModal(false)} />}
    </div>
  );
}
