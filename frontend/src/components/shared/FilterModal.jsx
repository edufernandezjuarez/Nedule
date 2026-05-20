import { useState, useEffect } from "react";

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

function FilterContent({ local, setLocal, genres, onApply, onReset }) {
  // Year input handlers
  function setYearMin(val) {
    const n = Math.max(1900, Math.min(parseInt(val) || 1900, local.yearMax));
    setLocal((f) => ({ ...f, yearMin: n }));
  }
  function setYearMax(val) {
    const n = Math.min(CURRENT_YEAR, Math.max(parseInt(val) || CURRENT_YEAR, local.yearMin));
    setLocal((f) => ({ ...f, yearMax: n }));
  }
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
        {/* Manual inputs */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            className="w-20 text-center rounded-lg px-2 py-1.5 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: C.white, ...MP }}
          />
          <span style={{ color: C.gray }}>–</span>
          <input
            type="number"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            className="w-20 text-center rounded-lg px-2 py-1.5 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: C.white, ...MP }}
          />
        </div>
        {/* Sliders */}
        <div className="flex flex-col gap-1.5">
          <input
            type="range"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            className="w-full"
            style={{ accentColor: C.yellow }}
          />
          <input
            type="range"
            min={1900}
            max={CURRENT_YEAR}
            value={local.yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            className="w-full"
            style={{ accentColor: C.yellow }}
          />
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

// ── Main export ───────────────────────────────────────────────────────────────
// Props:
//   filters       — estado actual de filtros
//   genres        — array de { id, name }
//   onApply(f)    — callback con los nuevos filtros
//   onClose()     — cerrar el modal
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

  // Sync si cambian los filtros externos
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Desktop: modal centrado / Mobile: sheet desde abajo */}
      <div
        className="fixed z-50 flex flex-col shadow-2xl
          bottom-0 left-0 right-0 rounded-t-3xl max-h-[88vh]
          sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto
          sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:w-[480px] sm:max-h-[85vh] sm:rounded-2xl"
        style={{ background: C.bg, ...MP }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ color: C.yellow, fontWeight: 800, fontSize: "1.3rem" }}>Filtros</span>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          <FilterContent local={local} setLocal={setLocal} genres={genres} onApply={handleApply} onReset={handleReset} />
        </div>
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
