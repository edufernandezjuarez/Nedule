import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchWatching, getUserId } from "../../api/index";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

export default function Watching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const userId = getUserId(user);
    fetchWatching(userId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP, paddingBottom: 80 }}>
      <div style={{ padding: "24px 16px 12px" }}>
        <span style={{ color: C.yellow, fontWeight: 800, fontSize: "2rem" }}>Mirando</span>
      </div>

      <div style={{ padding: "0 16px" }}>
        {items.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "48px 0" }}>No hay series en progreso</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => {
              const tmdbId = item.imdb_id.replace("tmdb_", "");
              return (
                <div
                  key={item.movie_id}
                  onClick={() => navigate(`/peliculas/tv/${tmdbId}`)}
                  style={{
                    display: "flex",
                    gap: 12,
                    background: C.card,
                    borderRadius: 12,
                    padding: "10px 12px",
                    cursor: "pointer",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={item.poster_url ?? ""}
                    alt={item.title}
                    style={{ width: 44, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#1e2a4a" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: C.white,
                        fontWeight: 600,
                        fontSize: 13,
                        margin: "0 0 4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>
                      Temporada {item.season} · Episodio {item.episode}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
