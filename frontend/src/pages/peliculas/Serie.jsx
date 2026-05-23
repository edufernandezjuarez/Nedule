import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, Outlet, useMatch } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchTmdbDetail,
  fetchReviews,
  submitReview,
  deleteReview as apiDeleteReview,
  fetchProgress,
  saveProgress,
  getUserId,
  fetchTvSeason,
} from "../../api/index";
import AddToListModal from "../../components/shared/AddToListModal";

const C = {
  bg: "#0d0f14",
  card: "#121b37",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
  blue: "#3b6fd4",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

function Stars({ rating, max = 10 }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < rating ? C.yellow : "rgba(255,255,255,0.15)", fontSize: 13 }}>
          ★
        </span>
      ))}
    </span>
  );
}

function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={16} height={16} stroke={C.yellow} strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeClosed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={16} height={16} stroke={C.gray} strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ReviewModal({ existingReview, onSubmit, onClose }) {
  const [selected, setSelected] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl" style={{ background: C.yellow, ...MP }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: "#000", fontWeight: 800, fontSize: "1.2rem", marginBottom: 12 }}>Rate y review</p>
        <div className="flex gap-0.5 mb-4 items-center">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setSelected(n)}
              style={{
                fontSize: 22,
                color: n <= (hover || selected) ? "#000" : "rgba(0,0,0,0.25)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ★
            </button>
          ))}
          <span style={{ color: "#000", fontSize: 13, fontWeight: 600, marginLeft: 6 }}>{selected}/10</span>
        </div>
        <textarea
          rows={4}
          placeholder="Comentario..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.1)",
            border: "none",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13,
            color: "#000",
            outline: "none",
            resize: "none",
            ...MP,
            boxSizing: "border-box",
          }}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              background: "rgba(0,0,0,0.1)",
              border: "none",
              color: "#000",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              ...MP,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (selected) onSubmit(selected, comment);
            }}
            disabled={!selected}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              background: selected ? "#000" : "rgba(0,0,0,0.2)",
              border: "none",
              color: selected ? C.yellow : "rgba(0,0,0,0.4)",
              fontWeight: 700,
              fontSize: 13,
              cursor: selected ? "pointer" : "default",
              ...MP,
            }}
          >
            {existingReview ? "Actualizar" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionsMenu({ onReview, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        right: 0,
        top: 32,
        zIndex: 40,
        background: "#1a1a2e",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {[
        { label: "Review", color: C.white, onClick: onReview },
        { label: "Agregar a vistos", color: C.white, onClick: () => {} },
        { label: "Hide", color: "#e05c5c", onClick: () => {} },
      ].map(({ label, color, onClick }) => (
        <button
          key={label}
          onClick={() => {
            onClick();
            onClose();
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color,
            fontWeight: 600,
            transition: "background 0.15s",
            ...MP,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ r, userId, onDelete }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px", overflow: "hidden", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: C.yellow,
            color: "#000",
            fontWeight: 800,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {r.username[0].toUpperCase()}
        </span>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{r.username}</span>
        {r.user_id === userId && (
          <button
            onClick={onDelete}
            style={{
              marginLeft: "auto",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#e05c5c",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.white,
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.comment ? 8 : 0 }}>
        <Stars rating={r.rating} />
        <span style={{ color: C.gray, fontSize: 12 }}>{r.rating}/10</span>
      </div>
      {r.comment && <p style={{ color: C.white, fontSize: 13, margin: 0, lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "anywhere" }}>{r.comment}</p>}
    </div>
  );
}

function SeasonTabs({ total, current, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ color: C.white, fontWeight: 700, fontSize: "0.95rem", marginRight: 4 }}>Temporada</span>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: current === n ? C.yellow : "rgba(255,255,255,0.08)",
            color: current === n ? "#000" : C.white,
            fontWeight: 700,
            fontSize: 14,
            ...MP,
            transition: "background 0.15s",
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function EpisodeCard({ ep, seasonNum, watchedEpisodes, onClick }) {
  const isWatched = ep.episode_number <= watchedEpisodes;
  return (
    <>
      {/* Desktop */}
      <div
        className="hidden sm:flex items-start gap-3 rounded-xl p-3 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        onClick={onClick}
      >
        <div style={{ width: 120, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#0a1020", aspectRatio: "16/9" }}>
          {ep.still_url ? (
            <img src={ep.still_url} alt={ep.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontSize: 11 }}>
              IMG
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>
              S{seasonNum}. E{ep.episode_number}. {ep.name}
            </p>
            {isWatched ? <EyeOpen /> : <EyeClosed />}
          </div>
          {ep.overview && (
            <p
              style={{
                color: C.gray,
                fontSize: "0.78rem",
                margin: 0,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {ep.overview}
            </p>
          )}
          {ep.rating && ep.rating !== "N/A" && <p style={{ color: C.gray, fontSize: 12, marginTop: 6 }}>☆{ep.rating}</p>}
        </div>
      </div>

      {/* Mobile — card pequeña para scroll horizontal */}
      <div
        className="sm:hidden flex flex-col rounded-xl overflow-hidden cursor-pointer"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", width: 140, flexShrink: 0 }}
        onClick={onClick}
      >
        <div style={{ width: "100%", aspectRatio: "16/9", background: "#0a1020" }}>
          {ep.still_url ? (
            <img src={ep.still_url} alt={ep.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, fontSize: 11 }}>
              IMG
            </div>
          )}
        </div>
        <div style={{ padding: "6px 8px" }}>
          <p
            style={{
              color: C.white,
              fontWeight: 700,
              fontSize: "0.72rem",
              margin: "0 0 2px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            S{seasonNum}. E{ep.episode_number}. {ep.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {ep.rating && ep.rating !== "N/A" && <span style={{ color: C.gray, fontSize: 10 }}>☆{ep.rating}</span>}
            <span style={{ marginLeft: "auto" }}>{isWatched ? <EyeOpen /> : <EyeClosed />}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Serie() {
  const { id: tmdbId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = getUserId(user);

  const [serie, setSerie] = useState(null);
  const [serieReviews, setSerieReviews] = useState([]);
  const [seasonReviews, setSeasonReviews] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [trackerSeason, setTrackerSeason] = useState(1);
  const [trackerEpisode, setTrackerEpisode] = useState(0);
  const episodeCountRef = useRef({});
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [showSerieReview, setShowSerieReview] = useState(false);
  const [showSeasonReview, setShowSeasonReview] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const mySerieReview = serieReviews.find((r) => r.user_id === userId) ?? null;
  const mySeasonReview = seasonReviews.find((r) => r.user_id === userId) ?? null;

  const isEpisodeOpenSearch = useMatch("/peliculas/search/tv/:id/season/:season/episode/:ep");
  const isEpisodeOpenDirect = useMatch("/peliculas/tv/:id/season/:season/episode/:ep");
  const isEpisodeOpen = isEpisodeOpenSearch || isEpisodeOpenDirect;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadSerie();
  }, [tmdbId]);

  useEffect(() => {
    if (serie) loadSeason(selectedSeason);
  }, [selectedSeason, serie]);

  async function loadSerie() {
    const [serieData, reviewData, progressRows] = await Promise.all([fetchTmdbDetail(tmdbId, "tv"), fetchReviews(tmdbId), fetchProgress(tmdbId, userId)]);
    setSerie(serieData);
    setSerieReviews(reviewData);
    const map = {};
    if (Array.isArray(progressRows))
      progressRows.forEach((row) => {
        map[row.season] = row.episode;
      });
    setProgressMap(map);
    if (progressRows && progressRows.length > 0) {
      const latest = progressRows.reduce((a, b) => (new Date(a.updated_at) > new Date(b.updated_at) ? a : b));
      setTrackerSeason(latest.season);
      setTrackerEpisode(latest.episode);
      setSelectedSeason(latest.season);
    }
  }

  async function loadSeason(season) {
    setLoadingEps(true);
    const [eps, reviews] = await Promise.all([fetchTvSeason(tmdbId, season), fetchReviews(tmdbId, season)]);
    setEpisodes(eps.episodes ?? []);
    episodeCountRef.current[season] = (eps.episodes ?? []).length;
    setSeasonReviews(reviews);
    setLoadingEps(false);
  }

  async function updateTracker(field, delta) {
    const maxSeason = serie?.number_of_seasons ?? 99;
    if (field === "season") {
      const newSeason = Math.max(1, Math.min(trackerSeason + delta, maxSeason));
      if (newSeason === trackerSeason) return;
      await persistProgress(trackerSeason, trackerEpisode);
      setTrackerSeason(newSeason);
    } else {
      const maxEp = episodeCountRef.current[trackerSeason] ?? 999;
      const current = progressMap[trackerSeason] ?? 0;
      const newEpisode = Math.max(0, Math.min(current + delta, maxEp));
      setTrackerEpisode(newEpisode);
      await persistProgress(trackerSeason, newEpisode);
    }
  }

  async function persistProgress(season, episode) {
    setProgressMap((prev) => {
      const next = { ...prev };
      if (episode === 0) delete next[season];
      else next[season] = episode;
      return next;
    });
    await saveProgress(tmdbId, { user_id: userId, season, episode, title: serie.title, year: serie.year, poster_url: serie.poster_url });
  }

  const totalEpisodes = serie?.number_of_episodes ?? 0;
  const watchedTotal = Object.values(progressMap).reduce((a, b) => a + b, 0);
  const pct = totalEpisodes > 0 ? Math.min(100, Math.round((watchedTotal / totalEpisodes) * 100)) : 0;
  const watchedInSelectedSeason = progressMap[selectedSeason] ?? 0;

  async function handleSubmitSerieReview(rating, comment) {
    await submitReview(tmdbId, { user_id: userId, rating, comment, title: serie.title, year: serie.year, poster_url: serie.poster_url, media_type: "tv" });
    setShowSerieReview(false);
    setSerieReviews(await fetchReviews(tmdbId));
  }
  async function handleDeleteSerieReview() {
    await apiDeleteReview(tmdbId, userId);
    setSerieReviews(await fetchReviews(tmdbId));
  }
  async function handleSubmitSeasonReview(rating, comment) {
    await submitReview(tmdbId, {
      user_id: userId,
      rating,
      comment,
      season: selectedSeason,
      title: serie.title,
      year: serie.year,
      poster_url: serie.poster_url,
      media_type: "tv",
    });
    setShowSeasonReview(false);
    setSeasonReviews(await fetchReviews(tmdbId, selectedSeason));
  }
  async function handleDeleteSeasonReview() {
    await apiDeleteReview(tmdbId, userId, selectedSeason);
    setSeasonReviews(await fetchReviews(tmdbId, selectedSeason));
  }

  if (!serie) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gray, ...MP }}>Cargando…</p>
      </div>
    );
  }

  const numSeasons = serie.number_of_seasons ?? 1;

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
      <div style={{ display: isEpisodeOpen ? "none" : "block" }}>
        {/* Backdrop */}
        {serie.backdrop_url && (
          <div
            style={{ height: 220, backgroundImage: `url(${serie.backdrop_url})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}
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
        {!serie.backdrop_url && (
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
          <div style={{ marginTop: serie.backdrop_url ? -60 : 16, position: "relative" }}>
            {/* Fila: poster + título + meta */}
            <div style={{ display: "flex", gap: 16, marginBottom: 0 }}>
              {serie.poster_url && (
                <img
                  src={serie.poster_url}
                  alt={serie.title}
                  style={{ width: 100, flexShrink: 0, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", objectFit: "cover", alignSelf: "flex-start" }}
                  className="sm:w-44"
                />
              )}
              <div style={{ flex: 1, minWidth: 0, paddingTop: serie.backdrop_url ? 70 : 0 }}>
                {/* Title + options */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <h1 style={{ color: C.white, fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 2rem)", lineHeight: 1.2, margin: 0, flex: 1 }}>{serie.title}</h1>
                  <div style={{ position: "relative", flexShrink: 0, marginTop: 4 }}>
                    <button
                      onClick={() => setShowOptions((v) => !v)}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "none",
                        borderRadius: 8,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: C.white,
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      ···
                    </button>
                    {showOptions && <OptionsMenu onReview={() => setShowSerieReview(true)} onClose={() => setShowOptions(false)} />}
                  </div>
                </div>
                {/* Meta */}
                <p style={{ color: C.gray, fontSize: 13, margin: 0, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span>Serie</span>
                  {numSeasons > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {numSeasons} temp{numSeasons > 1 ? "s" : "."}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{serie.year}</span>
                  <span>•</span>
                  <span style={{ color: C.white }}>★ {serie.rating}</span>
                </p>
              </div>
            </div>

            {/* Bloque inferior — ancho completo en mobile, a la derecha del poster en desktop */}
            <div className="sm:hidden" style={{ marginTop: 14 }}>
              {serie.overview && <p style={{ color: C.white, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{serie.overview}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {(serie.genres ?? []).map((g) => (
                  <span
                    key={g}
                    style={{ background: "rgba(255,255,255,0.08)", color: C.gray, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}
                  >
                    {g}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                {serie.director && serie.director !== "N/A" && (
                  <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>Director: </span>
                    <Link to={`/peliculas/person?name=${encodeURIComponent(serie.director)}`} style={{ color: C.blue, textDecoration: "none" }}>
                      {serie.director}
                    </Link>
                  </p>
                )}
                {serie.cast?.length > 0 && (
                  <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>Cast: </span>
                    {serie.cast.map((a, i) => (
                      <span key={a}>
                        <Link to={`/peliculas/person?name=${encodeURIComponent(a)}`} style={{ color: C.blue, textDecoration: "none" }}>
                          {a}
                        </Link>
                        {i < serie.cast.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              {/* Lista + tracker mobile */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() =>
                    setPendingMovie({
                      tmdb_id: serie.tmdb_id,
                      title: serie.title,
                      year: serie.year,
                      poster_url: serie.poster_url,
                      rating: serie.rating,
                      type: "tv",
                    })
                  }
                  style={{
                    background: C.blue,
                    color: C.white,
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    ...MP,
                  }}
                >
                  Lista +
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 12, padding: "6px 12px" }}>
                  <span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>T</span>
                  <button
                    onClick={() => updateTracker("season", -1)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: C.white,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span style={{ color: C.white, fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{trackerSeason}</span>
                  <button
                    onClick={() => updateTracker("season", 1)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: C.white,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 4px" }}>|</span>
                  <span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>E</span>
                  <button
                    onClick={() => updateTracker("episode", -1)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: C.white,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    −
                  </button>
                  <span style={{ color: C.white, fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{progressMap[trackerSeason] ?? 0}</span>
                  <button
                    onClick={() => updateTracker("episode", 1)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: C.white,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={async () => {
                      const maxEp = episodeCountRef.current[trackerSeason];
                      if (!maxEp) return;
                      const current = progressMap[trackerSeason] ?? 0;
                      if (current >= maxEp) return;
                      setTrackerEpisode(maxEp);
                      await persistProgress(trackerSeason, maxEp);
                    }}
                    style={{
                      height: 20,
                      borderRadius: 6,
                      padding: "0 5px",
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: C.white,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ++
                  </button>
                  <span style={{ color: C.gray, fontSize: 11, marginLeft: 8 }}>{pct}%</span>
                </div>
              </div>
            </div>

            {/* Desktop: overview, genres, cast, lista+, tracker — a la derecha del poster */}
            <div className="hidden sm:block" style={{ marginTop: 12 }}>
              {/* Para desktop seguimos con layout original de 2 col */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {serie.overview && <p style={{ color: C.white, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{serie.overview}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {(serie.genres ?? []).map((g) => (
                    <span
                      key={g}
                      style={{ background: "rgba(255,255,255,0.08)", color: C.gray, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                  {serie.director && serie.director !== "N/A" && (
                    <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                      <span style={{ fontWeight: 700 }}>Director: </span>
                      <Link to={`/peliculas/person?name=${encodeURIComponent(serie.director)}`} style={{ color: C.blue, textDecoration: "none" }}>
                        {serie.director}
                      </Link>
                    </p>
                  )}
                  {serie.cast?.length > 0 && (
                    <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                      <span style={{ fontWeight: 700 }}>Cast: </span>
                      {serie.cast.map((a, i) => (
                        <span key={a}>
                          <Link to={`/peliculas/person?name=${encodeURIComponent(a)}`} style={{ color: C.blue, textDecoration: "none" }}>
                            {a}
                          </Link>
                          {i < serie.cast.length - 1 && ", "}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() =>
                      setPendingMovie({
                        tmdb_id: serie.tmdb_id,
                        title: serie.title,
                        year: serie.year,
                        poster_url: serie.poster_url,
                        rating: serie.rating,
                        type: "tv",
                      })
                    }
                    style={{
                      background: C.blue,
                      color: C.white,
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      ...MP,
                    }}
                  >
                    Lista +
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 12, padding: "6px 12px", flexWrap: "wrap" }}>
                    <span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>T</span>
                    <button
                      onClick={() => updateTracker("season", -1)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: C.white,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <span style={{ color: C.white, fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{trackerSeason}</span>
                    <button
                      onClick={() => updateTracker("season", 1)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: C.white,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                    <span style={{ color: "rgba(255,255,255,0.2)", margin: "0 4px" }}>|</span>
                    <span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>E</span>
                    <button
                      onClick={() => updateTracker("episode", -1)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: C.white,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      −
                    </button>
                    <span style={{ color: C.white, fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: "center" }}>{progressMap[trackerSeason] ?? 0}</span>
                    <button
                      onClick={() => updateTracker("episode", 1)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: C.white,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={async () => {
                        const maxEp = episodeCountRef.current[trackerSeason];
                        if (!maxEp) return;
                        const current = progressMap[trackerSeason] ?? 0;
                        if (current >= maxEp) return;
                        setTrackerEpisode(maxEp);
                        await persistProgress(trackerSeason, maxEp);
                      }}
                      style={{
                        height: 20,
                        borderRadius: 6,
                        padding: "0 5px",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: C.white,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ++
                    </button>
                    <span style={{ color: C.gray, fontSize: 11, marginLeft: 8 }}>{pct}% completado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Zona temporadas ── */}
          <div style={{ marginTop: 28, background: C.card, borderRadius: 16, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <SeasonTabs total={numSeasons} current={selectedSeason} onChange={setSelectedSeason} />
              <span style={{ color: C.gray, fontSize: 12 }}>{pct}% completado</span>
            </div>
            {loadingEps ? (
              <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Cargando episodios…</p>
            ) : (
              <>
                {/* Mobile: scroll horizontal */}
                <div className="flex sm:hidden" style={{ gap: 8, overflowX: "auto", margin: "0 -16px", padding: "0 16px 8px", scrollbarWidth: "none" }}>
                  {episodes.map((ep) => (
                    <EpisodeCard
                      key={ep.episode_number}
                      ep={ep}
                      seasonNum={selectedSeason}
                      watchedEpisodes={watchedInSelectedSeason}
                      onClick={() => navigate(`season/${selectedSeason}/episode/${ep.episode_number}`)}
                    />
                  ))}
                </div>
                {/* Desktop: columna */}
                <div className="hidden sm:flex flex-col" style={{ gap: 10 }}>
                  {episodes.map((ep) => (
                    <EpisodeCard
                      key={ep.episode_number}
                      ep={ep}
                      seasonNum={selectedSeason}
                      watchedEpisodes={watchedInSelectedSeason}
                      onClick={() => navigate(`season/${selectedSeason}/episode/${ep.episode_number}`)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Reviews de la temporada */}
            <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ color: C.white, fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>Reviews Temporada {selectedSeason}</p>
                <button
                  onClick={() => setShowSeasonReview(true)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    background: C.yellow,
                    color: "#000",
                    fontWeight: 700,
                    fontSize: 11,
                    border: "none",
                    cursor: "pointer",
                    ...MP,
                  }}
                >
                  {mySeasonReview ? "Editar review" : "+ Review"}
                </button>
              </div>
              {seasonReviews.length === 0 ? (
                <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Sin reviews para esta temporada</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {seasonReviews.map((r) => (
                    <ReviewCard key={r.user_id} r={r} userId={userId} onDelete={handleDeleteSeasonReview} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Reviews serie general ── */}
          <div style={{ marginTop: 28 }}>
            <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 16 }}>Reviews</h2>
            {serieReviews.length === 0 ? (
              <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin reviews todavía</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {serieReviews.map((r) => (
                  <ReviewCard key={r.user_id} r={r} userId={userId} onDelete={handleDeleteSerieReview} />
                ))}
              </div>
            )}
          </div>

          {/* ── Galería ── */}
          {serie.gallery?.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 12 }}>Galeria</h2>
              <div
                className="sm:hidden"
                style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "0 16px 8px", scrollbarWidth: "none" }}
              >
                {serie.gallery.map((url, i) => (
                  <img key={i} src={url} alt="" loading="lazy" style={{ height: 140, width: "auto", borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />
                ))}
              </div>
              <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {serie.gallery.slice(0, 6).map((url, i) => (
                  <img key={i} src={url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 10 }} />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* ── Full Cast ── */}
        <CastSection fullCast={serie.fullCast} navigate={navigate} />
        {pendingMovie && <AddToListModal movie={pendingMovie} onClose={() => setPendingMovie(null)} />}
        {showSerieReview && <ReviewModal existingReview={mySerieReview} onSubmit={handleSubmitSerieReview} onClose={() => setShowSerieReview(false)} />}
        {showSeasonReview && <ReviewModal existingReview={mySeasonReview} onSubmit={handleSubmitSeasonReview} onClose={() => setShowSeasonReview(false)} />}
      </div>
      <Outlet />
    </div>
  );
}
