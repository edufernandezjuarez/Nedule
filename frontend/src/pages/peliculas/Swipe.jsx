import { useState, useEffect, useRef } from "react";
import { fetchTmdbSwipe, postHidden, fetchGenres, getUserId, fetchLists, createList, addMovieToList } from "../../api/index";
import { useAuth } from "../../hooks/useAuth";
import { useIsMobile } from "../../hooks/useIsMobile";
import AddToListModal from "../../components/shared/AddToListModal";
import { useNavigate, Outlet, useLocation } from "react-router-dom";

const CURRENT_YEAR = new Date().getFullYear();

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
  red: "#e05c5c",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

const CONTINENTS = [
  { key: "northamerica", label: "North America" },
  { key: "southamerica", label: "South America" },
  { key: "europe", label: "Europe" },
  { key: "asia", label: "Asia" },
  { key: "middleeast", label: "Middle East" },
  { key: "africa", label: "Africa" },
  { key: "oceania", label: "Oceania" },
];

const DEFAULT_FILTERS = {
  yearMin: 1900,
  yearMax: CURRENT_YEAR,
  genreIds: [],
  type: "all",
  continents: [],
  countryName: "",
};

// ── Filter Panel ──────────────────────────────────────────────────────────────
function FilterPanel({ local, setLocal, onApply, onClear, genres }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, ...MP }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: C.yellow, fontWeight: 800, fontSize: "1.4rem" }}>Filtros</span>
        <button
          onClick={onClear}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            background: "rgba(255,255,255,0.08)",
            color: C.gray,
            fontSize: 13,
            fontWeight: 600,
            ...MP,
          }}
        >
          Reset
        </button>
      </div>

      <div>
        <p style={{ color: C.white, fontWeight: 700, fontSize: "1rem", marginBottom: 10 }}>Tipo</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { k: "movie", l: "Movie" },
            { k: "tv", l: "Serie" },
          ].map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setLocal((f) => ({ ...f, type: f.type === k ? "all" : k }))}
              style={{
                padding: "6px 18px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                ...MP,
                background: local.type === k ? C.yellow : C.card,
                color: local.type === k ? "#000" : C.white,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ color: C.white, fontWeight: 700, fontSize: "1rem", marginBottom: 10 }}>Genero</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() =>
                setLocal((f) => ({
                  ...f,
                  genreIds: f.genreIds.includes(g.id) ? f.genreIds.filter((x) => x !== g.id) : [...f.genreIds, g.id],
                }))
              }
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                ...MP,
                background: local.genreIds.includes(g.id) ? C.yellow : C.card,
                color: local.genreIds.includes(g.id) ? "#000" : C.white,
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ color: C.white, fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>
          Año:{" "}
          <span style={{ color: C.gray, fontWeight: 400, fontSize: 13 }}>
            {local.yearMin} – {local.yearMax}
          </span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="range"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMin}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setLocal((f) => ({ ...f, yearMin: Math.min(v, f.yearMax) }));
            }}
            style={{ width: "100%", accentColor: C.yellow }}
          />
          <input
            type="range"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMax}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setLocal((f) => ({ ...f, yearMax: Math.max(v, f.yearMin) }));
            }}
            style={{ width: "100%", accentColor: C.yellow }}
          />
        </div>
      </div>

      <div>
        <p style={{ color: C.white, fontWeight: 700, fontSize: "1rem", marginBottom: 10 }}>Region</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {CONTINENTS.map((c) => (
            <button
              key={c.key}
              onClick={() =>
                setLocal((f) => ({
                  ...f,
                  continents: f.continents.includes(c.key) ? f.continents.filter((x) => x !== c.key) : [...f.continents, c.key],
                }))
              }
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                ...MP,
                background: local.continents.includes(c.key) ? C.yellow : C.card,
                color: local.continents.includes(c.key) ? "#000" : C.white,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Pais especifico..."
          value={local.countryName}
          onChange={(e) => setLocal((f) => ({ ...f, countryName: e.target.value }))}
          style={{
            width: "100%",
            background: C.card,
            border: "none",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: C.white,
            outline: "none",
            boxSizing: "border-box",
            ...MP,
          }}
        />
      </div>

      <button
        onClick={() => onApply(local)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 14,
          border: "none",
          cursor: "pointer",
          background: C.blue,
          color: C.white,
          fontSize: 14,
          fontWeight: 700,
          ...MP,
        }}
      >
        Aplicar
      </button>
    </div>
  );
}

// ── Swipeable Card ─────────────────────────────────────────────────────────────
function SwipeCard({ current, loading, onSwipeRight, onSwipeLeft, onAddClick, onTitleClick }) {
  const cardRef = useRef(null);
  const gesture = useRef({
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    isHorizontal: null,
  });

  const THRESHOLD = 80;
  const SCREEN_W = window.innerWidth;

  function applyTransform(dx, animated) {
    const el = cardRef.current;
    if (!el) return;
    const rotate = dx * 0.06;
    const opacity = 1 - Math.min(Math.abs(dx) / (SCREEN_W * 0.8), 0.5);
    el.style.transition = animated ? "transform 0.35s ease, opacity 0.35s ease" : "none";
    el.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
    el.style.opacity = opacity;
  }

  function resetCard(animated) {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = animated ? "transform 0.35s ease, opacity 0.35s ease" : "none";
    el.style.transform = "translateX(0px) rotate(0deg)";
    el.style.opacity = "1";
  }

  function flyOut(direction) {
    const el = cardRef.current;
    if (!el) return;
    const targetX = direction * SCREEN_W * 1.5;
    const rotate = direction * 30;
    el.style.transition = "transform 0.35s ease, opacity 0.35s ease";
    el.style.transform = `translateX(${targetX}px) rotate(${rotate}deg)`;
    el.style.opacity = "0";
  }

  const labelRightRef = useRef(null);
  const labelLeftRef = useRef(null);

  function updateLabels(dx) {
    const threshold = 30;
    if (labelRightRef.current) {
      const show = dx > threshold;
      labelRightRef.current.style.opacity = show ? Math.min((dx - threshold) / 80, 1) : 0;
    }
    if (labelLeftRef.current) {
      const show = dx < -threshold;
      labelLeftRef.current.style.opacity = show ? Math.min((-dx - threshold) / 80, 1) : 0;
    }
  }

  function onTouchStart(e) {
    if (loading || !current) return;
    const t = e.touches[0];
    gesture.current = { active: true, startX: t.clientX, startY: t.clientY, dx: 0, isHorizontal: null };
    applyTransform(0, false);
  }

  function onTouchMove(e) {
    if (!gesture.current.active) return;
    const t = e.touches[0];
    const dx = t.clientX - gesture.current.startX;
    const dy = t.clientY - gesture.current.startY;
    if (gesture.current.isHorizontal === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        gesture.current.isHorizontal = Math.abs(dx) >= Math.abs(dy);
      }
      return;
    }
    if (!gesture.current.isHorizontal) return;
    e.preventDefault();
    gesture.current.dx = dx;
    applyTransform(dx, false);
    updateLabels(dx);
  }

  function onTouchEnd() {
    if (!gesture.current.active) return;
    gesture.current.active = false;
    if (gesture.current.isHorizontal === null) return;
    if (!gesture.current.isHorizontal) return;
    const dx = gesture.current.dx;
    if (dx > THRESHOLD) {
      flyOut(1);
      setTimeout(() => onSwipeRight(), 350);
    } else if (dx < -THRESHOLD) {
      flyOut(-1);
      setTimeout(() => onSwipeLeft(), 350);
    } else {
      resetCard(true);
      updateLabels(0);
    }
  }

  function onTouchCancel() {
    gesture.current.active = false;
    resetCard(true);
    updateLabels(0);
  }

  useEffect(() => {
    gesture.current = { active: false, startX: 0, startY: 0, dx: 0, isHorizontal: null };
    resetCard(false);
    updateLabels(0);
  }, [current]);

  if (loading) {
    return (
      <div style={{ aspectRatio: "2/3", display: "flex", alignItems: "center", justifyContent: "center", background: C.card, borderRadius: 16 }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        style={{
          aspectRatio: "2/3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: C.card,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <p style={{ color: C.gray, textAlign: "center", fontSize: 14, ...MP }}>No hay más resultados con estos filtros</p>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      style={{
        background: C.card,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
        willChange: "transform",
        touchAction: "pan-y",
      }}
    >
      <div
        ref={labelRightRef}
        style={{
          position: "absolute",
          top: 20,
          left: 16,
          zIndex: 10,
          background: C.yellow,
          color: "#000",
          padding: "8px 16px",
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 15,
          ...MP,
          opacity: 0,
          border: "3px solid rgba(0,0,0,0.2)",
          transform: "rotate(-8deg)",
          pointerEvents: "none",
        }}
      >
        AÑADIR ✓
      </div>
      <div
        ref={labelLeftRef}
        style={{
          position: "absolute",
          top: 20,
          right: 16,
          zIndex: 10,
          background: C.red,
          color: C.white,
          padding: "8px 16px",
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 15,
          ...MP,
          opacity: 0,
          border: "3px solid rgba(0,0,0,0.2)",
          transform: "rotate(8deg)",
          pointerEvents: "none",
        }}
      >
        SKIP ✕
      </div>

      <div style={{ aspectRatio: "2/3", overflow: "hidden", background: "#1a1a2e" }}>
        {current.poster_url ? (
          <img src={current.poster_url} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.gray,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            IMG
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <h2
            onClick={() => onTitleClick(current)}
            style={{ color: C.white, fontWeight: 800, fontSize: "1.1rem", margin: 0, lineHeight: 1.2, ...MP, cursor: "pointer" }}
          >
            {current.title}
          </h2>
          <button
            onClick={() => onAddClick(current)}
            style={{
              flexShrink: 0,
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              background: C.yellow,
              color: "#000",
              fontSize: 12,
              fontWeight: 800,
              ...MP,
            }}
          >
            Visto
          </button>
        </div>
        <p style={{ color: C.gray, fontSize: 12, margin: "0 0 6px", ...MP }}>
          {current.type === "tv" ? "Serie" : "Movie"}
          {current.year ? ` · ${current.year}` : ""}
          {current.rating ? ` · ★ ${current.rating}` : ""}
        </p>
        {current.overview && (
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 12,
              margin: 0,
              lineHeight: 1.5,
              ...MP,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {current.overview}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Swipe() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Detect if a child route (movie/serie) is active
  const { pathname } = useLocation();
  const hasChildRoute = pathname.includes("/peliculas/swipe/movie/") || pathname.includes("/peliculas/swipe/tv/");

  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);

  const seenIds = useRef(new Set());
  const activeFiltersRef = useRef(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.yearMin !== 1900 ||
    filters.yearMax !== CURRENT_YEAR ||
    filters.genreIds.length > 0 ||
    filters.continents.length > 0 ||
    filters.countryName !== "" ||
    filters.type !== "all";

  function handleTitleClick(item) {
    navigate(item.type === "tv" ? `/peliculas/swipe/tv/${item.tmdb_id}` : `/peliculas/swipe/movie/${item.tmdb_id}`);
  }

  async function fetchNext() {
    setLoading(true);
    setCurrent(null);
    const userId = getUserId(user);
    const f = activeFiltersRef.current;
    const params = { userId };
    if (f.yearMin !== 1900) params.yearMin = f.yearMin;
    if (f.yearMax !== CURRENT_YEAR) params.yearMax = f.yearMax;
    if (f.genreIds.length > 0) params.genreIds = f.genreIds.join(",");
    if (f.continents.length > 0) params.continents = f.continents.join(",");
    if (f.countryName) params.countryName = f.countryName;
    if (f.type !== "all") params.type = f.type;
    if (seenIds.current.size > 0) params.exclude = [...seenIds.current].join(",");
    try {
      const data = await fetchTmdbSwipe(params);
      if (data?.tmdb_id) {
        seenIds.current.add(data.tmdb_id);
        setCurrent(data);
      } else setCurrent(null);
    } catch {
      setCurrent(null);
    }
    setLoading(false);
  }

  async function addToSwipeList() {
    if (!current) return;
    const userId = getUserId(user);
    const data = await fetchLists(userId);
    const all = [...(data.personal ?? []), ...(data.shared ?? [])];
    let swipeList = all.find((l) => l.name.toLowerCase() === "swipe");
    if (!swipeList) swipeList = await createList("Swipe", userId, false);
    await addMovieToList(
      swipeList.id,
      {
        tmdb_id: current.tmdb_id,
        title: current.title,
        year: current.year,
        poster_url: current.poster_url,
        rating: current.rating,
        type: current.type,
      },
      userId,
    );
    fetchNext();
  }

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);
  useEffect(() => {
    if (user !== undefined) fetchNext();
  }, [user]);
  useEffect(() => {
    setLocalFilters(filters);
  }, [showFilterSheet]);

  function applyFilters(newFilters) {
    activeFiltersRef.current = newFilters;
    setFilters(newFilters);
    setShowFilterSheet(false);
    seenIds.current = new Set();
    fetchNext();
  }

  function clearFilters() {
    applyFilters({ ...DEFAULT_FILTERS });
  }

  async function handleHide() {
    if (!current) return;
    const userId = getUserId(user);
    await postHidden({ user_id: userId, tmdb_id: current.tmdb_id, title: current.title, poster_url: current.poster_url, media_type: current.type });
    fetchNext();
  }

  function handleAddClose() {
    setPendingAdd(null);
  }

  // ── Child route overlay — fullscreen fixed, covers everything including navbar ──
  const childOverlay = hasChildRoute ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: C.bg,
        overflowY: "auto",
      }}
    >
      <Outlet />
    </div>
  ) : null;

  // ── Desktop card content (no swipe) ────────────────────────────────────────
  function DesktopCardContent() {
    if (loading) {
      return (
        <div style={{ aspectRatio: "2/3", display: "flex", alignItems: "center", justifyContent: "center", background: C.card, borderRadius: 16 }}>
          <p style={{ color: C.gray, ...MP }}>Cargando…</p>
        </div>
      );
    }
    if (!current) {
      return (
        <div
          style={{
            aspectRatio: "2/3",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: C.card,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <p style={{ color: C.gray, textAlign: "center", fontSize: 14, ...MP }}>No hay más resultados con estos filtros</p>
          <button
            onClick={() => {
              seenIds.current = new Set();
              fetchNext();
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: C.yellow,
              color: "#000",
              fontSize: 13,
              fontWeight: 700,
              ...MP,
            }}
          >
            Reset session
          </button>
        </div>
      );
    }
    return (
      <div style={{ background: C.card, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ aspectRatio: "2/3", overflow: "hidden", background: "#1a1a2e" }}>
          {current.poster_url ? (
            <img src={current.poster_url} alt={current.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.gray,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              IMG
            </div>
          )}
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <h2
              onClick={() => handleTitleClick(current)}
              style={{ color: C.white, fontWeight: 800, fontSize: "1.1rem", margin: 0, lineHeight: 1.2, ...MP, cursor: "pointer" }}
            >
              {current.title}
            </h2>
            <button
              onClick={() => setPendingAdd(current)}
              style={{
                flexShrink: 0,
                padding: "6px 16px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background: C.yellow,
                color: "#000",
                fontSize: 12,
                fontWeight: 800,
                ...MP,
              }}
            >
              Visto
            </button>
          </div>
          <p style={{ color: C.gray, fontSize: 12, margin: "0 0 6px", ...MP }}>
            {current.type === "tv" ? "Serie" : "Movie"}
            {current.year ? ` · ${current.year}` : ""}
            {current.rating ? ` · ★ ${current.rating}` : ""}
          </p>
          {current.overview && (
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12,
                margin: 0,
                lineHeight: 1.5,
                ...MP,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {current.overview}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Mobile layout ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div style={{ background: C.bg, display: "flex", flexDirection: "column", ...MP }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", flexShrink: 0 }}>
            <button
              onClick={handleHide}
              disabled={loading || !current}
              style={{
                padding: "7px 18px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                background: C.red,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                opacity: loading || !current ? 0.4 : 1,
                ...MP,
              }}
            >
              Hide
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => fetchNext()}
                disabled={loading || !current}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: C.card,
                  color: C.white,
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: loading || !current ? 0.4 : 1,
                  ...MP,
                }}
              >
                Skip
              </button>
              <button
                onClick={() => current && setPendingAdd(current)}
                disabled={loading || !current}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: C.card,
                  color: C.white,
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: loading || !current ? 0.4 : 1,
                  ...MP,
                }}
              >
                Añadir
              </button>
              <button
                onClick={() => setShowFilterSheet(true)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: hasActiveFilters ? C.yellow : C.card,
                  color: hasActiveFilters ? "#000" : C.white,
                  fontSize: 13,
                  fontWeight: 700,
                  ...MP,
                }}
              >
                Filtrar
              </button>
            </div>
          </div>

          <div style={{ padding: "0 48px 16px" }}>
            <SwipeCard
              current={current}
              loading={loading}
              onSwipeRight={addToSwipeList}
              onSwipeLeft={fetchNext}
              onAddClick={setPendingAdd}
              onTitleClick={handleTitleClick}
            />
          </div>

          {showFilterSheet && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowFilterSheet(false)} />
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#0d0f14",
                  borderRadius: "20px 20px 0 0",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
                </div>
                <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 32px" }}>
                  <FilterPanel local={localFilters} setLocal={setLocalFilters} onApply={applyFilters} onClear={clearFilters} genres={genres} />
                </div>
              </div>
            </>
          )}

          {pendingAdd && <AddToListModal movie={pendingAdd} onClose={handleAddClose} />}
        </div>

        {/* Overlay encima de todo, incluyendo el bottom nav */}
        {childOverlay}
      </>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", ...MP }}>
        <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "24px 20px", overflowY: "auto", background: C.bg }}>
          <FilterPanel local={localFilters} setLocal={setLocalFilters} onApply={applyFilters} onClear={clearFilters} genres={genres} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32, width: "100%", maxWidth: 800 }}>
            <button
              onClick={() => fetchNext()}
              disabled={loading || !current}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                opacity: loading || !current ? 0.4 : 1,
              }}
            >
              <span style={{ color: C.white, fontSize: 18, fontWeight: 700, ...MP }}>Skip</span>
              <span style={{ color: C.gray, fontSize: 22 }}>←</span>
            </button>

            <div style={{ width: 400, flexShrink: 0 }}>
              <DesktopCardContent />
            </div>

            <button
              onClick={() => current && setPendingAdd(current)}
              disabled={loading || !current}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                opacity: loading || !current ? 0.4 : 1,
              }}
            >
              <span style={{ color: C.white, fontSize: 18, fontWeight: 700, ...MP }}>Añadir</span>
              <span style={{ color: C.gray, fontSize: 22 }}>→</span>
            </button>
          </div>

          <button
            onClick={handleHide}
            disabled={loading || !current}
            style={{
              padding: "10px 32px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              background: C.red,
              color: C.white,
              fontSize: 14,
              fontWeight: 700,
              opacity: loading || !current ? 0.4 : 1,
              ...MP,
            }}
          >
            Hide
          </button>
        </div>

        {pendingAdd && <AddToListModal movie={pendingAdd} onClose={handleAddClose} />}
      </div>

      {/* Overlay encima de todo, incluyendo el top navbar */}
      {childOverlay}
    </>
  );
}
