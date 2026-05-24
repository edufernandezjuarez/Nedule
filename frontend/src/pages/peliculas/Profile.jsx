import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchUserReviews, getUserId, fetchWatched, fetchGenres } from "../../api/index";

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
    <div style={{ background: C.bg, borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: C.yellow }}>{value}</span>
      <span style={{ fontSize: 12, color: C.gray }}>{label}</span>
    </div>
  );
}

function SectionCard({ title, linkText, onLink, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{title}</span>
        {linkText && (
          <button onClick={onLink} style={{ background: "none", border: "none", color: C.blue, fontSize: 13, cursor: "pointer", padding: 0 }}>
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
        <div key={i} style={{ background: C.bg, borderRadius: 8, height: 72, display: "flex", alignItems: "center", gap: 12, padding: "0 14px" }}>
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

function RatingOverview({ reviews }) {
  const counts = Array.from({ length: 10 }, (_, i) => reviews.filter((r) => r.rating === i + 1).length);
  const max = Math.max(...counts, 1);
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

function TopGenres({ watched, genreMap }) {
  // Contar frecuencia de cada genre_id en todos los vistos
  const counts = {};
  watched.forEach((item) => {
    (item.genre_ids ?? []).forEach((id) => {
      counts[id] = (counts[id] ?? 0) + 1;
    });
  });

  const top3 = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ id: Number(id), name: genreMap[id] ?? `Genre ${id}`, count }));

  const maxCount = top3[0]?.count ?? 1;
  const COLORS = [C.blue, C.yellow, C.red];

  if (top3.length === 0) {
    return (
      <div style={{ background: C.card, borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>Géneros más vistos</p>
        <p style={{ fontSize: 13, color: C.gray }}>Sin datos todavía</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 12 }}>Géneros más vistos</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {top3.map((g, i) => (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.white, flex: 1 }}>{g.name}</span>
            <div style={{ flex: 2, height: 5, background: C.bg, borderRadius: 3 }}>
              <div style={{ width: `${(g.count / maxCount) * 100}%`, height: "100%", background: COLORS[i], borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [watched, setWatched] = useState([]);
  const [genreMap, setGenreMap] = useState({});

  const otherUsers = user === "Edu" ? [{ id: 2, name: "Nicole" }] : user === "Nicole" ? [{ id: 1, name: "Edu" }] : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const userId = getUserId(user);

    fetchUserReviews(userId).then((data) => {
      setReviews(data.filter((r) => r.season === null || r.season === undefined));
    });

    fetchWatched(userId).then(setWatched);

    fetchGenres().then((genres) => {
      const map = {};
      genres.forEach((g) => {
        map[g.id] = g.name;
      });
      setGenreMap(map);
    });
  }, [user]);

  const watchedMovies = watched.filter((i) => (i.media_type ?? "movie") === "movie").length;
  const watchedSeries = watched.filter((i) => i.media_type === "tv").length;
  const recentWatched = watched.slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: C.card, padding: "28px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <Avatar name={user} size={72} />
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>{user ?? "Usuario"}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <StatPill value={watchedMovies} label="Películas" />
          <StatPill value={watchedSeries} label="Series" />
          <StatPill value={reviews.length} label="Reviews" />
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

      {/* Contenido */}
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 900, margin: "0 auto" }}>
        {/* Reviews */}
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
                    style={{ background: C.bg, borderRadius: 8, display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer" }}
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

        {/* Rating + Géneros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <RatingOverview reviews={reviews} />
          <TopGenres watched={watched} genreMap={genreMap} />
        </div>

        {/* Vistos */}
        <SectionCard title="Vistos recientes" linkText="Ver todos..." onLink={() => navigate("/peliculas/watched")}>
          {recentWatched.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "16px 0" }}>No hay títulos vistos todavía</p>
          ) : (
            <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "0 -20px", padding: "0 20px 12px", scrollbarWidth: "thin" }}>
              {recentWatched.map((item) => {
                const tmdbId = item.imdb_id.replace("tmdb_", "");
                const type = item.media_type ?? "movie";
                return (
                  <div
                    key={item.movie_id}
                    onClick={() => navigate(`/peliculas/${type === "tv" ? "tv" : "movie"}/${tmdbId}`)}
                    style={{ cursor: "pointer", flexShrink: 0, width: 110 }}
                  >
                    <img
                      src={item.poster_url ?? ""}
                      alt={item.title}
                      style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 10, display: "block", background: "#1e2a4a" }}
                    />
                    <p
                      style={{
                        color: C.white,
                        fontSize: 11,
                        fontWeight: 600,
                        margin: "4px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Mirando */}
        <SectionCard title="Mirando" linkText="Ver todos..." onLink={() => navigate("/peliculas/watching")}>
          <PlaceholderRows count={2} right="T1 · E3" />
        </SectionCard>
      </div>
    </div>
  );
}
