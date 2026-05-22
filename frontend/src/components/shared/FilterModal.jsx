import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#151c2e",
  card: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  accent: "#378add",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

const CURRENT_YEAR = new Date().getFullYear();

const CONTINENTS = [
  { key: "northamerica", label: "North America" },
  { key: "europe", label: "Europe" },
  { key: "asia", label: "Asia" },
  { key: "southamerica", label: "South America" },
  { key: "middleeast", label: "Middle East" },
  { key: "oceania", label: "Oceania" },
  { key: "africa", label: "Africa" },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{
        ...MP,
        background: active ? C.yellow : "rgba(255,255,255,0.06)",
        color: active ? "#000" : C.white,
        border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );
}

// ── Year stepper row ──────────────────────────────────────────────────────────
function YearStepper({ label, value, min, max, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: C.gray, fontSize: 12, fontWeight: 600, width: 32, ...MP }}>{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: C.white,
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value);
          if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="text-center rounded-lg px-2 py-1.5 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ width: 68, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: C.white, ...MP }}
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: C.white,
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        +
      </button>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} style={{ flex: 1, accentColor: C.yellow }} />
    </div>
  );
}

function FilterContent({ local, setLocal, genres, onApply, onReset }) {
  function toggleType(t) {
    setLocal((f) => ({ ...f, type: f.type === t ? "all" : t }));
  }
  function toggleGenre(id) {
    setLocal((f) => ({
      ...f,
      genreIds: f.genreIds.includes(id) ? f.genreIds.filter((x) => x !== id) : [...f.genreIds, id],
    }));
  }
  function toggleContinent(key) {
    setLocal((f) => ({
      ...f,
      continents: f.continents.includes(key) ? f.continents.filter((x) => x !== key) : [...f.continents, key],
    }));
  }

  return (
    <div className="flex flex-col gap-5" style={MP}>
      {/* Tipo */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: C.gray, fontWeight: 600 }}>
          Tipo
        </p>
        <div className="flex gap-2">
          <Chip label="Movie" active={local.type === "movie"} onClick={() => toggleType("movie")} />
          <Chip label="Serie" active={local.type === "tv"} onClick={() => toggleType("tv")} />
        </div>
      </div>

      {/* Genero */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: C.gray, fontWeight: 600 }}>
          Genero
        </p>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Chip key={g.id} label={g.name} active={local.genreIds.includes(g.id)} onClick={() => toggleGenre(g.id)} />
          ))}
        </div>
      </div>

      {/* Año */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: C.gray, fontWeight: 600 }}>
          Año
        </p>
        <div className="flex flex-col gap-2.5">
          <YearStepper label="Min" value={local.yearMin} min={1900} max={local.yearMax} onChange={(v) => setLocal((f) => ({ ...f, yearMin: v }))} />
          <YearStepper label="Max" value={local.yearMax} min={local.yearMin} max={CURRENT_YEAR} onChange={(v) => setLocal((f) => ({ ...f, yearMax: v }))} />
        </div>
      </div>

      {/* Region */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: C.gray, fontWeight: 600 }}>
          Region
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CONTINENTS.map((c) => (
            <Chip key={c.key} label={c.label} active={local.continents.includes(c.key)} onClick={() => toggleContinent(c.key)} />
          ))}
        </div>
        <input
          type="text"
          placeholder="País específico..."
          value={local.countryName}
          onChange={(e) => setLocal((f) => ({ ...f, countryName: e.target.value }))}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.white, ...MP }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: C.white, ...MP }}
        >
          Reset
        </button>
        <button onClick={() => onApply(local)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: C.yellow, color: "#000", ...MP }}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ── Swipe-to-dismiss sheet (mobile) ───────────────────────────────────────────
function BottomSheet({ onDismiss, children }) {
  const sheetRef = useRef(null);
  const gesture = useRef({ active: false, startY: 0, dy: 0 });

  function applyTranslate(dy, animated) {
    const el = sheetRef.current;
    if (!el) return;
    const clamped = Math.max(0, dy); // only allow dragging down
    el.style.transition = animated ? "transform 0.3s ease" : "none";
    el.style.transform = `translateY(${clamped}px)`;
  }

  function onTouchStart(e) {
    gesture.current = { active: true, startY: e.touches[0].clientY, dy: 0 };
    applyTranslate(0, false);
  }

  function onTouchMove(e) {
    if (!gesture.current.active) return;
    const dy = e.touches[0].clientY - gesture.current.startY;
    gesture.current.dy = dy;
    applyTranslate(dy, false);
  }

  function onTouchEnd() {
    if (!gesture.current.active) return;
    gesture.current.active = false;
    const dy = gesture.current.dy;
    if (dy > 80) {
      // fly out then dismiss
      const el = sheetRef.current;
      if (el) {
        el.style.transition = "transform 0.25s ease";
        el.style.transform = `translateY(100%)`;
      }
      setTimeout(onDismiss, 250);
    } else {
      applyTranslate(0, true);
    }
  }

  function onTouchCancel() {
    gesture.current.active = false;
    applyTranslate(0, true);
  }

  return (
    <div
      ref={sheetRef}
      className="fixed z-50 flex flex-col shadow-2xl bottom-0 left-0 right-0 rounded-t-3xl max-h-[88vh]"
      style={{ background: C.bg, ...MP, willChange: "transform" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Draggable handle area */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        style={{ touchAction: "none", cursor: "grab" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: C.yellow, fontWeight: 800, fontSize: "1.3rem" }}>Filtros</span>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-5">{children}</div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function FilterModal({ filters, genres, onApply, onClose }) {
  const DEFAULT = {
    yearMin: 1900,
    yearMax: CURRENT_YEAR,
    genreIds: [],
    type: "all",
    continents: [],
    countryName: "",
  };

  const [local, setLocal] = useState({ ...filters });

  useEffect(() => {
    setLocal({ ...filters });
  }, [filters]);

  function handleApply(f) {
    onApply(f);
    onClose();
  }
  function handleReset() {
    setLocal({ ...DEFAULT });
    onApply({ ...DEFAULT });
    onClose();
  }

  const content = <FilterContent local={local} setLocal={setLocal} genres={genres} onApply={handleApply} onReset={handleReset} />;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Mobile: swipeable bottom sheet */}
      <div className="sm:hidden">
        <BottomSheet
          onDismiss={() => {
            handleApply(local);
          }}
        >
          {content}
        </BottomSheet>
      </div>

      {/* Desktop: centered modal */}
      <div
        className="hidden sm:flex fixed z-50 flex-col shadow-2xl
          sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:w-[480px] sm:max-h-[85vh] sm:rounded-2xl"
        style={{ background: C.bg, ...MP }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: C.yellow, fontWeight: 800, fontSize: "1.3rem" }}>Filtros</span>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5">{content}</div>
      </div>
    </>
  );
}

export { CONTINENTS };
export const DEFAULT_FILTERS = {
  yearMin: 1900,
  yearMax: CURRENT_YEAR,
  genreIds: [],
  type: "all",
  continents: [],
  countryName: "",
};
