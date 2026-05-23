import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { fetchUserReviews, getUserId } from "../../api/index";

const API = "/api";

// Obtiene la imagen del primer episodio de una temporada via TMDB
async function fetchSeasonThumb(tmdbId, season) {
  try {
    const res = await fetch(`${API}/tmdb/season-thumb/${tmdbId}/${season}`);
    const data = await res.json();
    return data.thumb ?? null;
  } catch {
    return null;
  }
}

function Stars({ rating }) {
  return (
    <span>
      {"★".repeat(rating)}
      <span className="text-content-muted/30">{"★".repeat(10 - rating)}</span>
      <span className="text-xs text-content-muted ml-1">{rating}/10</span>
    </span>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]); // [{general, seasonReviews:[]}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const userId = getUserId(user);
    fetchUserReviews(userId).then(async (data) => {
      // Separar reviews generales de temporadas
      const generals = data.filter((r) => r.season === null || r.season === undefined);
      const seasonal = data.filter((r) => r.season !== null && r.season !== undefined);

      // Agrupar reviews de temporadas por imdb_id
      const seasonMap = {};
      seasonal.forEach((r) => {
        if (!seasonMap[r.imdb_id]) seasonMap[r.imdb_id] = [];
        seasonMap[r.imdb_id].push(r);
      });

      // Series que tienen solo reviews de temporada pero no review general
      // (para mostrarlas igual como contenedor vacío)
      const generalIds = new Set(generals.map((r) => r.imdb_id));
      const seasonOnlyIds = Object.keys(seasonMap).filter((id) => !generalIds.has(id));

      // Construir grupos: primero los que tienen review general
      const grouped = generals.map((r) => ({
        general: r,
        seasonReviews: seasonMap[r.imdb_id] ?? [],
      }));

      // Agregar los que solo tienen reviews de temporadas (sin review general)
      seasonOnlyIds.forEach((imdbId) => {
        const anyReview = seasonMap[imdbId][0];
        grouped.push({
          general: {
            // contenedor vacío — título e imagen de la serie
            imdb_id: imdbId,
            title: anyReview.title,
            year: anyReview.year,
            poster_url: anyReview.poster_url,
            media_type: anyReview.media_type,
            rating: null,
            comment: null,
            season: null,
          },
          seasonReviews: seasonMap[imdbId],
        });
      });

      // Ordenar seasonReviews por season asc dentro de cada grupo
      grouped.forEach((g) => {
        g.seasonReviews.sort((a, b) => a.season - b.season);
      });

      // Fetch thumbnails para cada review de temporada
      const withThumbs = await Promise.all(
        grouped.map(async (g) => {
          if (g.seasonReviews.length === 0) return g;
          const tmdbId = g.general.imdb_id.replace("tmdb_", "");
          const thumbs = await Promise.all(g.seasonReviews.map((sr) => fetchSeasonThumb(tmdbId, sr.season)));
          return {
            ...g,
            seasonReviews: g.seasonReviews.map((sr, i) => ({ ...sr, thumb: thumbs[i] })),
          };
        }),
      );

      setGroups(withThumbs);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center " style={{ background: "#0d0f14" }}>
        <p className="text-content-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0f14" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold mb-4" style={{ color: "#f5c518", fontSize: "1.5rem", fontWeight: 800 }}>
          Historial de Reviews
        </h1>
        {groups.length === 0 ? (
          <p className="text-content-muted text-sm text-center py-12">No reviews yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => {
              const tmdbId = g.general.imdb_id.replace("tmdb_", "");
              const type = g.general.media_type ?? "movie";
              const hasGeneralReview = g.general.rating !== null;

              return (
                <div key={g.general.imdb_id} className="flex flex-col gap-0">
                  {/* ── Fila serie ── */}
                  <div
                    onClick={() => navigate(`/peliculas/${type === "tv" ? "tv" : "movie"}/${tmdbId}`)}
                    className="flex gap-3 bg-surface-alt rounded-2xl border border-white/[0.07] p-3 cursor-pointer hover:shadow-sm transition-shadow"
                    style={{ borderBottomLeftRadius: g.seasonReviews.length ? 0 : undefined, borderBottomRightRadius: g.seasonReviews.length ? 0 : undefined }}
                  >
                    {/* Poster o placeholder */}
                    {g.general.poster_url ? (
                      <img src={g.general.poster_url} alt={g.general.title} className="w-14 h-20 object-cover rounded-xl flex-shrink-0 bg-surface-alt" />
                    ) : (
                      <div className="w-14 h-20 rounded-xl flex-shrink-0 bg-surface flex items-center justify-center">
                        <span className="text-content-muted text-xl">?</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 min-w-0 justify-center">
                      <p className="font-medium text-content text-sm leading-snug">{g.general.title}</p>
                      <p className="text-xs text-content-muted">
                        {g.general.year} · {type === "tv" ? "Series" : "Movie"}
                      </p>
                      {hasGeneralReview ? (
                        <>
                          <p className="text-sm text-yellow-400">
                            <Stars rating={g.general.rating} />
                          </p>
                          {g.general.comment && <p className="text-xs text-content-muted line-clamp-2">{g.general.comment}</p>}
                        </>
                      ) : (
                        <p className="text-xs text-content-muted italic">Sin review general</p>
                      )}
                    </div>
                  </div>

                  {/* ── Temporadas tabuladas ── */}
                  {g.seasonReviews.map((sr, idx) => {
                    const isLast = idx === g.seasonReviews.length - 1;
                    return (
                      <div
                        key={sr.season}
                        className="flex gap-3 p-3 cursor-pointer hover:shadow-sm transition-shadow"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderTop: "none",
                          marginLeft: 24,
                          borderBottomLeftRadius: isLast ? 16 : 0,
                          borderBottomRightRadius: isLast ? 16 : 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                        }}
                        onClick={() => navigate(`/peliculas/tv/${tmdbId}`)}
                      >
                        {/* Thumb episodio 1 o placeholder */}
                        {sr.thumb ? (
                          <img
                            src={sr.thumb}
                            alt={`T${sr.season}`}
                            className="flex-shrink-0 object-cover rounded-lg bg-surface-alt"
                            style={{ width: 80, height: 45 }}
                          />
                        ) : (
                          <div
                            className="flex-shrink-0 rounded-lg bg-surface flex items-center justify-center"
                            style={{ width: 80, height: 45, background: "#0d0f14" }}
                          >
                            <span className="text-content-muted text-xs">T{sr.season}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0 justify-center">
                          <p className="text-xs font-semibold text-content">Temporada {sr.season}</p>
                          <p className="text-sm text-yellow-400">
                            <Stars rating={sr.rating} />
                          </p>
                          {sr.comment && <p className="text-xs text-content-muted line-clamp-2">{sr.comment}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
