import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchUserReviews, getUserId } from "../../api/index";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  cardInner: "#0d0f14",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
  red: "#e05c5c",
};

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function Avatar({ name, size = 72 }) {
  const letter = name?.charAt(0).toUpperCase() ?? "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: C.yellow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 800,
        color: C.card,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function StatPill({ value, label }) {
  return (
    <div
      style={{
        background: C.bg,
        borderRadius: 20,
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, color: C.yellow }}>{value}</span>
      <span style={{ fontSize: 12, color: C.gray }}>{label}</span>
    </div>
  );
}

function SectionCard({ title, linkText, onLink, children }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{title}</span>
        {linkText && (
          <button
            onClick={onLink}
            style={{
              background: "none",
              border: "none",
              color: C.blue,
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {linkText}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function PlaceholderRows({ count = 2, right = null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: C.bg,
            borderRadius: 8,
            height: 72,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 14px",
          }}
        >
          <div style={{ width: 44, height: 60, borderRadius: 4, background: "#1e2a4a", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 10, borderRadius: 4, background: "#1e2a4a", width: "60%" }} />
            <div style={{ height: 10, borderRadius: 4, background: "#1e2a4a", width: "40%" }} />
          </div>
          {right && <span style={{ fontSize: 11, color: C.gray }}>{right}</span>}
        </div>
      ))}
    </div>
  );
}

function PlaceholderCards({ count = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: C.bg,
            borderRadius: 8,
            aspectRatio: "2/3",
            display: "flex",
            alignItems: "flex-end",
            padding: 8,
          }}
        >
          <div style={{ height: 8, borderRadius: 3, background: "#1e2a4a", width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

function TopGenres() {
  const genres = [
    { name: "Drama", pct: 80, color: C.blue },
    { name: "Acción", pct: 60, color: C.yellow },
    { name: "Thriller", pct: 45, color: C.red },
  ];
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>Géneros más vistos</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {genres.map((g) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.white, flex: 1 }}>{g.name}</span>
            <div style={{ flex: 2, height: 5, background: C.bg, borderRadius: 3 }}>
              <div style={{ width: `${g.pct}%`, height: "100%", background: g.color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function RatingOverview({ reviews }) {
  // Contar cuántas reviews hay por cada rating 1-10
  const counts = Array.from({ length: 10 }, (_, i) => {
    return reviews.filter((r) => r.rating === i + 1).length;
  });
  const max = Math.max(...counts, 1); // mínimo 1 para evitar división por cero

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>Rating overview</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64, padding: "0 4px" }}>
        {counts.map((v, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              borderRadius: "3px 3px 0 0",
              background: i >= 7 ? C.yellow : i >= 5 ? C.blue : "#1e2a4a",
              minHeight: v > 0 ? 4 : 0,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 4px 0", fontSize: 10, color: C.gray }}>
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Profile() {
  // FIX: user es un string ("Edu", "Nicole"), no un objeto con .name
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = { movies: 142, series: 38, reviews: 27 };
  const otherUsers = user === "Edu" ? [{ id: 2, name: "Nicole" }] : user === "Nicole" ? [{ id: 1, name: "Edu" }] : [];
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const userId = getUserId(user);
    fetchUserReviews(userId).then((data) => {
      // Solo reviews generales (sin temporadas) para el preview
      const generals = data.filter((r) => r.season === null || r.season === undefined);
      setReviews(generals);
    });
  }, [user]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.white,
        fontFamily: "system-ui, sans-serif",
        paddingBottom: 80,
      }}
    >
      {/* ── Header ── */}
      <div style={{ background: C.card, padding: "28px 24px 24px" }}>
        {/* Avatar + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          {/* FIX: se pasa user directamente (string) en vez de user?.name */}
          <Avatar name={user} size={72} />
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>{user ?? "Usuario"}</h1>
            {/* nedule.uk removido */}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <StatPill value={stats.movies} label="Películas" />
          <StatPill value={stats.series} label="Series" />
          <StatPill value={stats.reviews} label="Reviews" />
        </div>

        {otherUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: C.gray }}>Visitar</span>
            {otherUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/profile/${u.id}`)}
                style={{
                  background: C.blue,
                  border: "none",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.white,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Avatar name={u.name} size={20} />
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <SectionCard title="Reviews" linkText="Ver todas..." onLink={() => navigate("/peliculas/reviews")}>
          {reviews.length === 0 ? (
            <PlaceholderRows count={2} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
              {reviews.map((r) => {
                const tmdbId = r.imdb_id.replace("tmdb_", "");
                const type = r.media_type ?? "movie";
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/peliculas/${type === "tv" ? "tv" : "movie"}/${tmdbId}`)}
                    style={{
                      background: C.bg,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={r.poster_url ?? ""}
                      alt={r.title}
                      style={{ width: 44, height: 60, borderRadius: 4, objectFit: "cover", flexShrink: 0, background: "#1e2a4a" }}
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
                        {r.title}
                      </p>
                      <p style={{ color: C.gray, fontSize: 11, margin: "0 0 4px" }}>
                        {r.year} · {type === "tv" ? "Serie" : "Película"}
                      </p>
                      <p style={{ fontSize: 12, margin: 0, color: C.yellow }}>
                        {"★".repeat(r.rating)}
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>{"★".repeat(10 - r.rating)}</span>
                        <span style={{ color: C.gray, fontSize: 11, marginLeft: 4 }}>{r.rating}/10</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <RatingOverview reviews={reviews} />
          <TopGenres />
        </div>

        <SectionCard title="Vistos" linkText="Ver todos..." onLink={() => navigate("/peliculas/watching")}>
          <PlaceholderCards count={3} />
        </SectionCard>

        <SectionCard title="Mirando" linkText="Ver todos..." onLink={() => navigate("/peliculas/watching")}>
          <PlaceholderRows count={2} right="T1 · E3" />
        </SectionCard>
      </div>
    </div>
  );
}
