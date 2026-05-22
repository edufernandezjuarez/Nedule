import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Outlet, useMatch } from "react-router-dom";
import { fetchTmdbPopular, fetchTmdbSearch, fetchGenres } from "../../api/index";
import AddToListModal from "../../components/shared/AddToListModal";
import FilterModal, { DEFAULT_FILTERS } from "../../components/shared/FilterModal";

const C = {
  bg: "#0d0f14",
  card: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

const SORT_OPTIONS = [
  { key: "popularity_desc", label: "Popularidad", dir: "↓" },
  { key: "popularity_asc", label: "Popularidad", dir: "↑" },
  { key: "rating_desc", label: "Rating", dir: "↓" },
  { key: "rating_asc", label: "Rating", dir: "↑" },
  { key: "year_desc", label: "Año", dir: "↓" },
  { key: "year_asc", label: "Año", dir: "↑" },
];

const SORT_GROUPS = [
  { label: "Popularidad", desc: "popularity_desc", asc: "popularity_asc" },
  { label: "Rating", desc: "rating_desc", asc: "rating_asc" },
  { label: "Año", desc: "year_desc", asc: "year_asc" },
];

// ── Desktop card ──────────────────────────────────────────────────────────────
function DesktopSearchCard({ movie, onAdd }) {
  const navigate = useNavigate();
  const tmdbId = movie.tmdb_id ?? movie.imdb_id?.replace("tmdb_", "");
  const type = movie.type ?? movie.media_type ?? "movie";
  const rating = movie.rating ?? movie.imdb_rating;

  return (
    <div
      className="flex flex-col cursor-pointer rounded-xl overflow-hidden"
      style={{ background: C.card, ...MP }}
      onClick={() => navigate(type === "tv" ? `/peliculas/search/tv/${tmdbId}` : `/peliculas/search/movie/${tmdbId}`)}
    >
      <div style={{ aspectRatio: "2/3", background: "#0a1020", flexShrink: 0 }}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.gray }}>
            Sin poster
          </div>
        )}
      </div>
      <div style={{ padding: "8px 8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <p className="text-xs leading-snug line-clamp-2" style={{ color: C.white, fontWeight: 600 }}>
          {movie.title}
        </p>
        <p className="text-[10px]" style={{ color: C.gray }}>
          {movie.year}
          {type && <span> · {type === "tv" ? "Serie" : "Movie"}</span>}
        </p>
        {rating && (
          <p className="text-[10px]" style={{ color: C.gray }}>
            ☆{rating}
          </p>
        )}
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="mt-auto w-full py-1 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity"
            style={{ background: C.blue, color: C.white, marginTop: 6, ...MP }}
          >
            Añadir +
          </button>
        )}
      </div>
    </div>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileSearchCard({ movie, onAdd }) {
  const navigate = useNavigate();
  const tmdbId = movie.tmdb_id ?? movie.imdb_id?.replace("tmdb_", "");
  const type = movie.type ?? movie.media_type ?? "movie";
  const rating = movie.rating ?? movie.imdb_rating;

  return (
    <div
      className="flex w-full cursor-pointer overflow-hidden"
      style={{ background: C.card, boxSizing: "border-box", ...MP }}
      onClick={() => navigate(type === "tv" ? `/peliculas/search/tv/${tmdbId}` : `/peliculas/search/movie/${tmdbId}`)}
    >
      <div style={{ width: 90, minHeight: 120, flexShrink: 0, background: "#0a1020" }}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.gray }}>IMG</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
        <p
          style={{
            color: C.white,
            fontWeight: 700,
            fontSize: "0.95rem",
            lineHeight: 1.3,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {movie.title}
        </p>
        <p style={{ color: C.gray, fontSize: "0.8rem", margin: 0 }}>
          {movie.year}
          {type && <span> · {type === "tv" ? "Serie" : "Movie"}</span>}
        </p>
        {rating && <p style={{ color: C.gray, fontSize: "0.8rem", margin: 0 }}>☆{rating}</p>}
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              padding: "6px 14px",
              borderRadius: 8,
              background: C.yellow,
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              ...MP,
            }}
          >
            Añadir +
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sort menu ─────────────────────────────────────────────────────────────────
function SortMenu({ current, onChange, onClose }) {
  const menuRef = useRef(null);
  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: 50,
        right: 0,
        zIndex: 50,
        background: "#181818",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "6px 0",
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {SORT_GROUPS.map(({ label, desc, asc }) => (
        <div key={label}>
          <p style={{ color: C.gray, fontSize: 10, fontWeight: 600, padding: "6px 16px 2px", textTransform: "uppercase", letterSpacing: 1, ...MP }}>{label}</p>
          <div style={{ display: "flex", gap: 6, padding: "2px 12px 6px" }}>
            {[
              { key: desc, dir: "↓" },
              { key: asc, dir: "↑" },
            ].map(({ key, dir }) => (
              <button
                key={key}
                onClick={() => {
                  onChange(current === key ? null : key);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  background: current === key ? C.yellow : "rgba(255,255,255,0.07)",
                  color: current === key ? "#000" : C.white,
                  ...MP,
                }}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function IMDB() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [genres, setGenres] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const moviePage = useRef(1);
  const tvPage = useRef(1);
  const movieHasMore = useRef(null);
  const tvHasMore = useRef(null);
  const renderedIds = useRef(new Set());
  const isLoadingMore = useRef(false);
  const currentQuery = useRef("");
  const currentSortBy = useRef(null);
  const activeFiltersRef = useRef(filters);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const sortBtnRef = useRef(null);
  const voteCountLevel = useRef(0);

  // Ocultar buscador cuando hay película/serie abierta
  const isMovieOpen = useMatch("/peliculas/search/movie/:id");
  const isSerieOpen = useMatch("/peliculas/search/tv/:id");
  const isEpisodeOpen = useMatch("/peliculas/search/tv/:id/season/:season/episode/:ep");
  const isContentOpen = isMovieOpen || isSerieOpen || isEpisodeOpen;

  useEffect(() => {
    activeFiltersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    fetchGenres().then(setGenres);
    triggerSearch(true);
  }, []);

  function checkHasFilters(f) {
    const CY = new Date().getFullYear();
    return f.yearMin !== 1900 || f.yearMax !== CY || f.genreIds.length > 0 || f.continents.length > 0 || f.countryName !== "" || f.type !== "all";
  }

  function buildParams(f) {
    const CY = new Date().getFullYear();
    const p = { moviePage: moviePage.current, tvPage: tvPage.current };
    if (movieHasMore.current === false) p.skipMovie = true;
    if (tvHasMore.current === false) p.skipTv = true;
    if (f.yearMin !== 1900) p.yearMin = f.yearMin;
    if (f.yearMax !== CY) p.yearMax = f.yearMax;
    if (f.genreIds.length > 0) p.genreIds = f.genreIds.join(",");
    if (f.continents.length > 0) p.continents = f.continents.join(",");
    if (f.countryName) p.countryName = f.countryName;
    if (f.type !== "all") p.type = f.type;
    if (currentSortBy.current) p.sortBy = currentSortBy.current;
    if (currentSortBy.current?.startsWith("rating")) p.voteCountLevel = voteCountLevel.current;
    return p;
  }

  const fetchPage = useCallback(async () => {
    if (isLoadingMore.current) return;
    isLoadingMore.current = true;
    setIsLoading(true);
    const f = activeFiltersRef.current;
    const params = buildParams(f);
    let data;
    if (currentQuery.current) {
      data = await fetchTmdbSearch(currentQuery.current, params);
    } else {
      data = await fetchTmdbPopular(params);
    }
    const newItems = [];
    for (const item of data.results) {
      const rid = `${item.tmdb_id}_${item.type}`;
      if (!renderedIds.current.has(rid)) {
        renderedIds.current.add(rid);
        newItems.push(item);
      }
    }
    setResults((prev) => [...prev, ...newItems]);
    if (data.movieHasMore !== undefined) movieHasMore.current = data.movieHasMore;
    if (data.tvHasMore !== undefined) tvHasMore.current = data.tvHasMore;
    if (movieHasMore.current || tvHasMore.current) {
      if (newItems.length === 0) {
        if (movieHasMore.current) moviePage.current++;
        if (tvHasMore.current) tvPage.current++;
        isLoadingMore.current = false;
        setIsLoading(false);
        fetchPage();
        return;
      }
      setupSentinel();
    } else {
      if (currentSortBy.current?.startsWith("rating") && voteCountLevel.current < 2) {
        voteCountLevel.current++;
        moviePage.current = 1;
        tvPage.current = 1;
        movieHasMore.current = null;
        tvHasMore.current = null;
        isLoadingMore.current = false;
        setIsLoading(false);
        fetchPage();
        return;
      }
      removeSentinel();
    }
    isLoadingMore.current = false;
    setIsLoading(false);
  }, []);

  function setupSentinel() {
    removeSentinel();
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore.current) {
          if (movieHasMore.current) moviePage.current++;
          if (tvHasMore.current) tvPage.current++;
          fetchPage();
        }
      },
      { rootMargin: "200px" },
    );
    observerRef.current.observe(sentinelRef.current);
  }

  function removeSentinel() {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }

  function resetPagination() {
    moviePage.current = 1;
    tvPage.current = 1;
    movieHasMore.current = null;
    tvHasMore.current = null;
    renderedIds.current = new Set();
    voteCountLevel.current = 0;
    removeSentinel();
    setResults([]);
  }

  function triggerSearch(initial = false) {
    const q = initial ? "" : query.trim();
    currentQuery.current = q;
    resetPagination();
    fetchPage();
  }

  function applyFilters(newFilters) {
    activeFiltersRef.current = newFilters;
    setFilters(newFilters);
    setHasActiveFilters(checkHasFilters(newFilters));
    resetPagination();
    fetchPage();
  }

  function handleSortChange(newSort) {
    currentSortBy.current = newSort;
    setSortBy(newSort);
    resetPagination();
    fetchPage();
  }

  const sortOption = SORT_OPTIONS.find((o) => o.key === sortBy);
  const sortLabel = sortOption ? `${sortOption.label} ${sortOption.dir}` : "Sort";
  const sortActive = !!sortBy;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP, width: "100%", boxSizing: "border-box" }}>
      {/* Buscador — oculto cuando hay contenido abierto */}
      <div style={{ display: isContentOpen ? "none" : "block" }}>
        {/* Search bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: C.bg,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "12px 16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <input
            type="text"
            placeholder="Titulo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "0 16px",
              height: 42,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: C.white,
              fontSize: 16,
              outline: "none",
              boxSizing: "border-box",
              ...MP,
            }}
          />
          <button
            onClick={() => triggerSearch()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#0a5a5a",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={20} height={20} stroke="#4de8e8" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => setShowFilter(true)}
            style={{
              height: 42,
              padding: "0 14px",
              borderRadius: 12,
              background: hasActiveFilters ? C.yellow : "#0d2a50",
              color: hasActiveFilters ? "#000" : "#5eaff0",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              ...MP,
            }}
          >
            Filtrar{hasActiveFilters ? " ●" : ""}
          </button>
          <div style={{ position: "relative", flexShrink: 0 }} ref={sortBtnRef}>
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              style={{
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                background: sortActive ? C.yellow : "rgba(255,255,255,0.08)",
                color: sortActive ? "#000" : C.white,
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                ...MP,
              }}
            >
              {sortLabel}
            </button>
            {showSortMenu && <SortMenu current={sortBy} onChange={handleSortChange} onClose={() => setShowSortMenu(false)} />}
          </div>
          <button
            onClick={() => navigate("/peliculas/cast")}
            style={{
              height: 42,
              padding: "0 14px",
              borderRadius: 12,
              background: "#0a5a5a",
              color: "#4de8e8",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
              ...MP,
            }}
          >
            Cast
          </button>
        </div>

        {/* Results */}
        <div className="sm:px-4" style={{ paddingTop: 16, paddingBottom: 16, width: "100%", boxSizing: "border-box" }}>
          {results.length === 0 && !isLoading ? (
            <p style={{ textAlign: "center", paddingTop: 64, fontSize: 14, color: C.gray }}>Sin resultados</p>
          ) : (
            <>
              <div className="flex flex-col sm:hidden" style={{ gap: 8, width: "100%", boxSizing: "border-box" }}>
                {results.map((item) => (
                  <MobileSearchCard key={`${item.tmdb_id}_${item.type}`} movie={item} onAdd={() => setPendingMovie(item)} />
                ))}
              </div>
              <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                {results.map((item) => (
                  <DesktopSearchCard key={`${item.tmdb_id}_${item.type}`} movie={item} onAdd={() => setPendingMovie(item)} />
                ))}
              </div>
            </>
          )}
          {isLoading && <p style={{ textAlign: "center", paddingTop: 32, fontSize: 14, color: C.gray }}>Cargando…</p>}
          <div ref={sentinelRef} style={{ height: 4 }} />
        </div>

        {showFilter && <FilterModal filters={filters} genres={genres} onApply={applyFilters} onClose={() => setShowFilter(false)} />}
        {pendingMovie && <AddToListModal movie={pendingMovie} onClose={() => setPendingMovie(null)} />}
      </div>

      {/* Contenido (película o serie) se renderiza acá */}
      <Outlet />
    </div>
  );
}
