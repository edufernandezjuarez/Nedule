import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchPeople } from "../../api/index";

const C = {
  bg: "#0d0f14",
  card: "#101b31",
  white: "#ffffff",
  gray: "#7a7a7a",
  cyan: "#4de8e8",
  cyanBg: "#0a5a5a",
  yellow: "#f5c518",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

// ── Desktop card (vertical, foto + nombre abajo) ───────────────────────────
function DesktopPersonCard({ person, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col cursor-pointer rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
      style={{ background: C.card, ...MP }}
    >
      {/* Foto */}
      <div style={{ aspectRatio: "2/3", background: "#0a1020", flexShrink: 0 }}>
        {person.photo_url ? (
          <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: C.gray }}>
            {person.name[0]}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "8px 8px 10px" }}>
        <p className="text-xs leading-snug font-bold line-clamp-2" style={{ color: C.white }}>
          {person.name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: C.gray }}>
          {person.known_for}
        </p>
      </div>
    </div>
  );
}

// ── Mobile card (fila horizontal) ─────────────────────────────────────────
function MobilePersonCard({ person, onClick }) {
  return (
    <div onClick={onClick} className="flex w-full cursor-pointer overflow-hidden" style={{ background: C.card, boxSizing: "border-box", ...MP }}>
      {/* Foto cuadrada */}
      <div style={{ width: 80, height: 80, flexShrink: 0, background: "#0a1020" }}>
        {person.photo_url ? (
          <img src={person.photo_url} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: C.gray,
            }}
          >
            {person.name[0]}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, padding: "0 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
        <p style={{ color: C.white, fontWeight: 700, fontSize: "1rem", margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {person.name}
        </p>
        <p style={{ color: C.gray, fontSize: "0.82rem", margin: 0 }}>{person.known_for}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Cast() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const data = await searchPeople(query.trim());
    setResults(data);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP, width: "100%", boxSizing: "border-box" }}>
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
          placeholder="Buscar actor o director..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
        {/* Lupa */}
        <button
          onClick={handleSearch}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: C.cyanBg,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" width={20} height={20} stroke={C.cyan} strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </button>
        {/* Volver a Pelis */}
        <button
          onClick={() => navigate("/peliculas/search")}
          style={{
            height: 42,
            padding: "0 14px",
            borderRadius: 12,
            background: C.yellow,
            color: "#000",
            fontWeight: 700,
            fontSize: 13,
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            ...MP,
          }}
        >
          Pelis
        </button>
      </div>

      {/* Results */}
      <div className="sm:px-4" style={{ paddingTop: 16, paddingBottom: 16, width: "100%", boxSizing: "border-box" }}>
        {loading && <p style={{ textAlign: "center", paddingTop: 64, fontSize: 14, color: C.gray }}>Cargando…</p>}
        {!loading && searched && results.length === 0 && <p style={{ textAlign: "center", paddingTop: 64, fontSize: 14, color: C.gray }}>Sin resultados</p>}
        {!loading && results.length > 0 && (
          <>
            {/* Mobile: filas */}
            <div className="flex flex-col sm:hidden" style={{ gap: 8, width: "100%", boxSizing: "border-box" }}>
              {results.map((person) => (
                <MobilePersonCard key={person.id} person={person} onClick={() => navigate(`/peliculas/person?id=${person.id}`)} />
              ))}
            </div>
            {/* Desktop: grid de cards */}
            <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
              {results.map((person) => (
                <DesktopPersonCard key={person.id} person={person} onClick={() => navigate(`/peliculas/person?id=${person.id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
