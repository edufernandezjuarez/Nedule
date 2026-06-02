import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchHidden, unhideTitle, getUserId } from "../../api/index";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  red: "#e05c5c",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

export default function Hidden() {
  const { user } = useAuth();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, [user]);

  async function load() {
    const userId = getUserId(user);
    const data = await fetchHidden(userId);
    setTitles(data);
    setLoading(false);
  }

  async function handleUnhide(tmdbId) {
    const userId = getUserId(user);
    await unhideTitle(userId, tmdbId);
    setTitles((prev) => prev.filter((t) => t.tmdb_id !== tmdbId));
  }

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
        <span style={{ color: C.yellow, fontWeight: 800, fontSize: "2rem" }}>Hidden</span>
      </div>

      <div style={{ padding: "0 16px" }}>
        {titles.length === 0 ? (
          <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "48px 0" }}>No hay títulos escondidos</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {titles.map((t) => (
              <div key={t.tmdb_id} style={{ display: "flex", gap: 12, background: C.card, borderRadius: 12, padding: "10px 12px", alignItems: "center" }}>
                <img
                  src={t.poster_url ?? ""}
                  alt={t.title}
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
                    {t.title}
                  </p>
                  <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>{t.media_type === "tv" ? "Serie" : "Película"}</p>
                </div>
                <button
                  onClick={() => handleUnhide(t.tmdb_id)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "none",
                    color: C.white,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    ...MP,
                  }}
                >
                  Unhide
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
