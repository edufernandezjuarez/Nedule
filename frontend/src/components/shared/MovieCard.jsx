import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0d0f14",
  card: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
};

const MP = { fontFamily: "'Maven Pro', sans-serif" };

function CardMenu({ onAdd, onDelete, onClose }) {
  return (
    <div
      data-movie-menu
      className="rounded-xl shadow-2xl overflow-hidden min-w-[170px]"
      style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {onAdd && (
        <button
          onClick={() => {
            onClose();
            onAdd();
          }}
          className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
          style={{ color: C.white, ...MP }}
        >
          Añadir otra lista
        </button>
      )}
      <button onClick={() => onClose()} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors" style={{ color: C.white, ...MP }}>
        Marcar como vista
      </button>
      {onDelete && (
        <>
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <button
            onClick={() => {
              onClose();
              onDelete();
            }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors"
            style={{ color: "#e05c5c", ...MP }}
          >
            Eliminar
          </button>
        </>
      )}
    </div>
  );
}

// ── Desktop card ─────────────────────────────────────────────────────────────
function DesktopCard({ movie, onAdd, onDelete, onBeforeNavigate }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ bottom: true });

  const tmdbId = movie.tmdb_id ?? movie.imdb_id?.replace("tmdb_", "");
  const type = movie.type ?? movie.media_type ?? "movie";
  const rating = movie.rating ?? movie.imdb_rating;

  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
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
      onClick={() => {
        onBeforeNavigate?.();
        navigate(`/peliculas/movie/${tmdbId}?type=${type}`);
      }}
    >
      <div className="relative rounded-xl overflow-hidden mx-1" style={{ aspectRatio: "2/3", background: "#1a1a2e" }}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
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
          className="absolute z-50"
          style={{
            position: "fixed",
            top: btnRef.current
              ? menuPos.bottom
                ? btnRef.current.getBoundingClientRect().top - 8 - 130
                : btnRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left: btnRef.current ? btnRef.current.getBoundingClientRect().right - 170 : 0,
          }}
        >
          <CardMenu onAdd={onAdd} onDelete={onDelete} onClose={() => setOpen(false)} />
        </div>
      )}
      <div className="mt-0 px-2 py-2">
        <p className="text-sm leading-snug line-clamp-2" style={{ color: C.white, fontWeight: 600 }}>
          {movie.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: C.gray }}>
          {movie.year}
          {type && <span> · {type === "tv" ? "Series" : "Movie"}</span>}
        </p>
        {rating && (
          <p className="text-xs mt-0.5" style={{ color: C.gray }}>
            ☆{rating}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileCard({ movie, onAdd, onDelete, onBeforeNavigate }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const tmdbId = movie.tmdb_id ?? movie.imdb_id?.replace("tmdb_", "");
  const type = movie.type ?? movie.media_type ?? "movie";
  const rating = movie.rating ?? movie.imdb_rating;

  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      className="flex items-center gap-3 rounded-xl relative cursor-pointer"
      style={{ background: C.card, padding: "0 12px 0 0", ...MP, overflow: "hidden" }}
      onClick={() => {
        onBeforeNavigate?.();
        navigate(`/peliculas/movie/${tmdbId}?type=${type}`);
      }}
    >
      <div className="flex-shrink-0 overflow-hidden" style={{ width: 80, background: "#0d0f14", borderRadius: "12px 0 0 12px" }}>
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.gray }}>
            IMG
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2" style={{ color: C.white, fontWeight: 600 }}>
          {movie.title}
        </p>
        <p className="text-xs mt-1" style={{ color: C.gray }}>
          {movie.year}
          {type && <span> · {type === "tv" ? "Series" : "Movie"}</span>}
        </p>
        {rating && (
          <p className="text-xs mt-0.5" style={{ color: C.gray }}>
            ☆{rating}
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
          <CardMenu onAdd={onAdd} onDelete={onDelete} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function MovieCard({ movie, onAdd, onDelete, forceMobile, onBeforeNavigate }) {
  if (forceMobile) return <MobileCard movie={movie} onAdd={onAdd} onDelete={onDelete} onBeforeNavigate={onBeforeNavigate} />;
  return <DesktopCard movie={movie} onAdd={onAdd} onDelete={onDelete} onBeforeNavigate={onBeforeNavigate} />;
}
