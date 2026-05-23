import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchPerson, searchPersonByName } from "../../api/index";
import AddToListModal from "../../components/shared/AddToListModal";

const C = {
  bg: "#0d0f14",
  card: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
  border: "rgba(255,255,255,0.07)",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

// ── Card menu ─────────────────────────────────────────────────────────────────
function CardMenu({ onAdd, onClose }) {
  return (
    <div
      data-movie-menu
      className="rounded-xl shadow-2xl overflow-hidden min-w-[170px]"
      style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onAdd();
        }}
        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
        style={{ color: C.white, ...MP }}
      >
        Añadir a lista
      </button>
      <button onClick={onClose} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors" style={{ color: C.white, ...MP }}>
        Marcar como vista
      </button>
      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <button onClick={onClose} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors" style={{ color: "#e05c5c", ...MP }}>
        Hide
      </button>
    </div>
  );
}

// ── Desktop card ──────────────────────────────────────────────────────────────
function DesktopCard({ item, onAdd }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ bottom: true });

  const type = item.type ?? "movie";

  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleOpenMenu(e) {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ bottom: window.innerHeight - rect.bottom < 160 });
    }
    setOpen((v) => !v);
  }

  return (
    <div
      className="flex flex-col cursor-pointer group rounded-xl overflow-visible pt-1.5 px-1"
      style={{ background: C.card, borderRadius: 12, ...MP }}
      onClick={() => navigate(type === "tv" ? `/peliculas/tv/${item.tmdb_id}` : `/peliculas/movie/${item.tmdb_id}`)}
    >
      <div className="relative rounded-xl overflow-hidden mx-1" style={{ aspectRatio: "2/3", background: "#1a1a2e" }}>
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.gray }}>
            Sin poster
          </div>
        )}
        <button
          ref={btnRef}
          data-movie-menu
          onClick={handleOpenMenu}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-opacity opacity-0 group-hover:opacity-100"
          style={{ background: C.blue, color: C.white, zIndex: 10 }}
        >
          •••
        </button>
      </div>
      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: btnRef.current
              ? menuPos.bottom
                ? btnRef.current.getBoundingClientRect().top - 8 - 130
                : btnRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left: btnRef.current ? btnRef.current.getBoundingClientRect().right - 170 : 0,
            zIndex: 9999,
          }}
        >
          <CardMenu onAdd={onAdd} onClose={() => setOpen(false)} />
        </div>
      )}
      <div className="mt-0 px-2 py-2">
        <p className="text-sm leading-snug line-clamp-2" style={{ color: C.white, fontWeight: 600 }}>
          {item.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: C.gray }}>
          {item.year}
          {type && <span> · {type === "tv" ? "Series" : "Movie"}</span>}
        </p>
        {item.rating && (
          <p className="text-xs mt-0.5" style={{ color: C.gray }}>
            ☆{item.rating}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileCard({ item, onAdd }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const type = item.type ?? "movie";

  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      className="flex items-center gap-3 rounded-xl relative cursor-pointer"
      style={{ background: C.card, padding: "0 12px 0 0", ...MP, overflow: "hidden" }}
      onClick={() => navigate(type === "tv" ? `/peliculas/tv/${item.tmdb_id}` : `/peliculas/movie/${item.tmdb_id}`)}
    >
      <div className="flex-shrink-0 overflow-hidden" style={{ width: 80, background: "#0d0f14", borderRadius: "12px 0 0 12px" }}>
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" style={{ aspectRatio: "2/3" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.gray, minHeight: 80 }}>
            IMG
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2" style={{ color: C.white, fontWeight: 600 }}>
          {item.title}
        </p>
        <p className="text-xs mt-1" style={{ color: C.gray }}>
          {item.year}
          {type && <span> · {type === "tv" ? "Series" : "Movie"}</span>}
        </p>
        {item.rating && (
          <p className="text-xs mt-0.5" style={{ color: C.gray }}>
            ☆{item.rating}
          </p>
        )}
      </div>
      <button
        ref={btnRef}
        data-movie-menu
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: C.blue, color: C.white }}
      >
        •••
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: btnRef.current ? btnRef.current.getBoundingClientRect().bottom + 6 : 0,
            left: btnRef.current ? btnRef.current.getBoundingClientRect().right - 170 : 0,
            zIndex: 9999,
          }}
        >
          <CardMenu onAdd={onAdd} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Person() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const personIdParam = searchParams.get("id");
  const personName = searchParams.get("name");

  const [person, setPerson] = useState(null);
  const [allCredits, setAllCredits] = useState([]);
  const [activeTab, setActiveTab] = useState("movie");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [sort, setSort] = useState({ field: null, asc: false });
  const [showSort, setShowSort] = useState(false);
  const sortMenuRef = useRef(null);

  const personIdRef = useRef(personIdParam);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    init();
  }, [personIdParam, personName]);

  async function init() {
    setAllCredits([]);
    pageRef.current = 1;
    setPerson(null);

    let id = personIdParam;
    if (!id && personName) {
      const data = await searchPersonByName(personName);
      if (!data?.id) {
        setPerson({ name: "Person not found", photo_url: null, known_for: "" });
        return;
      }
      id = data.id;
      navigate(`/peliculas/person?id=${id}`, { replace: true });
    }
    if (!id) return;
    personIdRef.current = id;
    await loadPage(id, true);
  }

  async function loadPage(id, reset = false) {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    const data = await fetchPerson(id ?? personIdRef.current, pageRef.current);

    if (reset) {
      setPerson({ name: data.name, photo_url: data.photo_url, known_for: data.known_for });
      setAllCredits(data.credits);
    } else {
      setAllCredits((prev) => [...prev, ...data.credits]);
    }

    hasMoreRef.current = data.hasMore;
    if (data.hasMore) setupSentinel();
    else removeSentinel();

    isLoadingRef.current = false;
    setIsLoading(false);
  }

  function setupSentinel() {
    removeSentinel();
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          pageRef.current++;
          loadPage(personIdRef.current);
        }
      },
      { threshold: 1.0 },
    );
    observerRef.current.observe(sentinelRef.current);
  }

  function removeSentinel() {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }

  async function handleTabSwitch(tab) {
    setActiveTab(tab);
    setSort({ field: null, asc: false });
    if (hasMoreRef.current) {
      removeSentinel();
      let currentPage = pageRef.current;
      let credits = [...allCredits];
      while (hasMoreRef.current) {
        currentPage++;
        const data = await fetchPerson(personIdRef.current, currentPage);
        credits = [...credits, ...data.credits];
        hasMoreRef.current = data.hasMore;
        setAllCredits([...credits]); // ← actualizar en cada página para que se vea progresivamente
      }
      pageRef.current = currentPage;
    }
  }

  function buildPendingMovie(item) {
    return {
      tmdb_id: item.tmdb_id,
      title: item.title,
      year: item.year,
      poster_url: item.poster_url,
      rating: item.rating,
      type: item.type ?? "movie",
    };
  }

  const filteredCredits = allCredits
    .filter((c) => c.type === activeTab)
    .sort((a, b) => {
      if (!sort.field) return 0;
      const dir = sort.asc ? 1 : -1;
      if (sort.field === "alpha") return dir * a.title.localeCompare(b.title);
      if (sort.field === "year") return dir * ((parseInt(a.year) || 0) - (parseInt(b.year) || 0));
      if (sort.field === "rating") return dir * ((parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0));
      if (sort.field === "popularity") return dir * ((parseFloat(a.popularity) || 0) - (parseFloat(b.popularity) || 0));
      return 0;
    });
  useEffect(() => {
    function h(e) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setShowSort(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    // Si después de cargar no hay resultados en el tab activo
    // pero hay más páginas, cargar todo en background
    if (!isLoading && person && filteredCredits.length === 0 && hasMoreRef.current) {
      async function loadRest() {
        let credits = [...allCredits];
        while (hasMoreRef.current) {
          pageRef.current++;
          const data = await fetchPerson(personIdRef.current, pageRef.current);
          credits = [...credits, ...data.credits];
          hasMoreRef.current = data.hasMore;
          setAllCredits([...credits]);
        }
      }
      loadRest();
    }
  }, [isLoading, person, filteredCredits.length]);
  if (!person) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP }}>
      {/* ── Header ── */}
      <div style={{ background: "#121b37", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: "20px 16px 0", display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.06)" }}>
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.gray,
                }}
              >
                {person.name[0]}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ color: C.white, fontWeight: 800, fontSize: "1.3rem", margin: 0, lineHeight: 1.2 }}>{person.name}</h1>
            {person.known_for && <p style={{ color: C.gray, fontSize: 13, margin: "4px 0 0" }}>{person.known_for}</p>}
          </div>
        </div>

        {/* Tabs + Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px 0" }}>
          <span style={{ color: C.gray, fontSize: 13, fontWeight: 600, marginRight: 4 }}>Credits:</span>
          <button
            onClick={() => handleTabSwitch("movie")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              ...MP,
              background: activeTab === "movie" ? C.yellow : "rgba(255,255,255,0.08)",
              color: activeTab === "movie" ? "#000" : C.gray,
            }}
          >
            Movies
          </button>
          <button
            onClick={() => handleTabSwitch("tv")}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              ...MP,
              background: activeTab === "tv" ? C.yellow : "rgba(255,255,255,0.08)",
              color: activeTab === "tv" ? "#000" : C.gray,
            }}
          >
            Series
          </button>
          <div style={{ marginLeft: "auto", position: "relative" }} ref={sortMenuRef}>
            <button
              onClick={() => setShowSort((v) => !v)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                background: C.yellow,
                color: "#000",
                ...MP,
              }}
            >
              Sort
            </button>
            {showSort && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 36,
                  zIndex: 50,
                  background: "#181818",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  minWidth: 180,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  overflow: "hidden",
                }}
              >
                {[
                  { key: "popularity", label: "Popularidad" },
                  { key: "year", label: "Año" },
                  { key: "rating", label: "Rating" },
                  { key: "alpha", label: "Alfabético" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSort((prev) => ({ field: key, asc: prev.field === key ? !prev.asc : false }));
                      setShowSort(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: sort.field === key ? C.yellow : C.white, ...MP, fontWeight: 500 }}
                  >
                    <span>{label}</span>
                    <span style={{ color: sort.field === key ? C.yellow : C.gray }}>
                      {sort.field === key ? (sort.asc ? (key === "alpha" ? "↓" : "↑") : key === "alpha" ? "↑" : "↓") : "↓↑"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 14 }} />
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "16px 16px 80px" }}>
        {filteredCredits.length === 0 && !isLoading ? (
          <p style={{ color: C.gray, fontSize: 13, textAlign: "center", paddingTop: 48 }}>No {activeTab === "movie" ? "movies" : "series"} found</p>
        ) : (
          <>
            {/* Desktop: grid */}
            <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
              {filteredCredits.map((item) => (
                <DesktopCard key={`${item.tmdb_id}_${item.type}`} item={item} onAdd={() => setPendingMovie(buildPendingMovie(item))} />
              ))}
            </div>
            {/* Mobile: lista */}
            <div className="flex flex-col sm:hidden" style={{ gap: 8 }}>
              {filteredCredits.map((item) => (
                <MobileCard key={`${item.tmdb_id}_${item.type}`} item={item} onAdd={() => setPendingMovie(buildPendingMovie(item))} />
              ))}
            </div>
          </>
        )}
        {isLoading && <p style={{ color: C.gray, fontSize: 13, textAlign: "center", paddingTop: 24 }}>Cargando…</p>}
        <div ref={sentinelRef} style={{ height: 4 }} />
      </div>

      {pendingMovie && <AddToListModal movie={pendingMovie} onClose={() => setPendingMovie(null)} />}
    </div>
  );
}
