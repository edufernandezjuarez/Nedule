import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0d0f14",
  card: "#1c1c1c",
  white: "#ffffff",
  gray: "#7a7a7a",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

const SECTIONS = [
  { label: "IMDB", path: "/peliculas/listas", enabled: true },
  { label: "Juegos", path: "/juegos", enabled: false },
  { label: "Musica", path: "/musica", enabled: false },
  { label: "Drive", path: "/drive", enabled: false },
  { label: "Juegos de mesa", path: "/juegos-de-mesa", enabled: false },
  { label: "Libros", path: "/libros", enabled: false },
  { label: "Recetario", path: "/recetario", enabled: false },
];

export default function PeliculasIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-6 pt-8 pb-8" style={{ background: C.bg, ...MP }}>
      {/* Logo — solo mobile */}
      <div className="flex items-center gap-2 mb-8 sm:hidden">
        <span style={{ color: "#e05c5c", fontSize: "1.5rem" }}>♥</span>
        <span style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", ...MP }}>Nedule</span>
      </div>

      {/* Grid de botones — tamaño fijo, no estirado */}
      <div className="flex flex-wrap gap-4">
        {SECTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => s.enabled && navigate(s.path)}
            disabled={!s.enabled}
            style={{
              ...MP,
              width: "180px",
              height: "110px",
              background: C.card,
              color: s.enabled ? C.white : C.gray,
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "16px",
              textAlign: "center",
              padding: "0",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: s.enabled ? "pointer" : "default",
              border: "none",
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={(e) => {
              if (s.enabled) e.currentTarget.style.background = "#252525";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.card;
            }}
            onMouseDown={(e) => {
              if (s.enabled) e.currentTarget.style.transform = "scale(0.97)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
