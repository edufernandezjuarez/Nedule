import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchTvEpisode, fetchTmdbDetail } from "../../api/index";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

export default function Episode() {
  const { id: tvId, season, ep } = useParams();
  const navigate = useNavigate();

  const [episode, setEpisode] = useState(null);
  const [backdropUrl, setBackdropUrl] = useState(null);

  useEffect(() => {
    // Cargar episodio y backdrop de la serie en paralelo
    Promise.all([fetchTvEpisode(tvId, season, ep), fetchTmdbDetail(tvId, "tv")]).then(([epData, serieData]) => {
      setEpisode(epData);
      setBackdropUrl(serieData?.backdrop_url ?? null);
    });
  }, [tvId, season, ep]);

  if (!episode) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }
  function CastSection({ fullCast, navigate }) {
    if (!fullCast?.length) return null;
    return (
      <div style={{ marginTop: 28 }}>
        <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 12, padding: "0 16px" }}>Cast completo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12, padding: "0 16px" }}>
          {fullCast.map((p) => (
            <div
              key={`${p.role}-${p.id}`}
              onClick={() => navigate(`/peliculas/person?name=${encodeURIComponent(p.name)}`)}
              style={{ cursor: "pointer", textAlign: "center" }}
            >
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.name}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 10, display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "2/3",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.gray,
                    fontSize: 22,
                  }}
                >
                  ?
                </div>
              )}
              <p style={{ color: C.white, fontSize: 11, fontWeight: 700, margin: "6px 0 2px", lineHeight: 1.3 }}>{p.name}</p>
              <p style={{ color: C.gray, fontSize: 10, margin: 0, lineHeight: 1.3 }}>{p.role === "directing" ? "Director" : p.character || "Acting"}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: "100vh", background: C.bg, ...MP }}>
      {/* Backdrop con gradiente */}
      {backdropUrl && (
        <div
          style={{
            height: 220,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,15,20,0.2), #0d0f14)" }} />
          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: C.white,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              ...MP,
            }}
          >
            ← Back
          </button>
        </div>
      )}
      {!backdropUrl && (
        <div style={{ padding: "16px 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontWeight: 600, cursor: "pointer", ...MP }}
          >
            ← Back
          </button>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* ── Hero ── */}
        <div className="flex gap-4 sm:gap-6" style={{ marginTop: backdropUrl ? -60 : 16, position: "relative" }}>
          {/* Still */}
          {episode.still_url && (
            <img
              src={episode.still_url}
              alt={episode.name}
              style={{ width: 160, flexShrink: 0, borderRadius: 12, objectFit: "cover", alignSelf: "flex-start", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
              className="sm:w-64"
            />
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: backdropUrl ? 70 : 0 }}>
            <h1 style={{ color: C.white, fontWeight: 800, fontSize: "clamp(1.1rem, 3vw, 1.8rem)", lineHeight: 1.2, margin: "0 0 8px" }}>{episode.name}</h1>

            {/* Meta */}
            <p style={{ color: C.gray, fontSize: 13, margin: "0 0 10px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>Ep. {episode.episode_number}</span>
              <span>•</span>
              <span>Temp. {episode.season_number}</span>
              {episode.runtime && (
                <>
                  <span>•</span>
                  <span>{episode.runtime} min</span>
                </>
              )}
              {episode.air_date && (
                <>
                  <span>•</span>
                  <span>{episode.air_date?.slice(0, 4)}</span>
                </>
              )}
              {episode.rating && episode.rating !== "N/A" && (
                <>
                  <span>•</span>
                  <span style={{ color: C.white }}>★ {episode.rating}</span>
                </>
              )}
            </p>

            {/* Overview */}
            {episode.overview && <p style={{ color: C.white, fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>{episode.overview}</p>}

            {/* Director + Cast */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {episode.director && episode.director !== "N/A" && (
                <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Director: </span>
                  <Link to={`/peliculas/person?name=${encodeURIComponent(episode.director)}`} style={{ color: C.blue, textDecoration: "none" }}>
                    {episode.director}
                  </Link>
                </p>
              )}
              {episode.cast?.length > 0 && (
                <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Cast: </span>
                  {episode.cast.map((a, i) => (
                    <span key={a}>
                      <Link to={`/peliculas/person?name=${encodeURIComponent(a)}`} style={{ color: C.blue, textDecoration: "none" }}>
                        {a}
                      </Link>
                      {i < episode.cast.length - 1 && ", "}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Galería ── */}
        <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 12 }}>Galeria</h2>
        {episode.gallery?.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="sm:hidden" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "0 16px 8px", scrollbarWidth: "none" }}>
              {episode.gallery.map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" style={{ height: 140, width: "auto", borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />
              ))}
            </div>
            <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {episode.gallery.slice(0, 6).map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 10 }} />
              ))}
            </div>
          </div>
        )}
        {/* ── FullCast ── */}
        <CastSection fullCast={episode.fullCast} navigate={navigate} />
      </div>
    </div>
  );
}
