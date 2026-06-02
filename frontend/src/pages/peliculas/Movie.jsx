import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchTmdbDetail,
  fetchReviews,
  submitReview,
  deleteReview as apiDeleteReview,
  fetchProgress,
  saveProgress,
  getUserId,
  markWatched,
  unmarkWatched,
  checkWatched,
  checkHidden,
  postHidden,
  unhideTitle,
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

// ── Star rating display ───────────────────────────────────────────────────────
function Stars({ rating, max = 10 }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < rating ? C.yellow : "rgba(255,255,255,0.15)", fontSize: 14 }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ── Review modal ──────────────────────────────────────────────────────────────
function ReviewModal({ existingReview, onSubmit, onClose }) {
  const [selected, setSelected] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full sm:w-96 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl" style={{ background: C.yellow, ...MP }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: "#000", fontWeight: 800, fontSize: "1.2rem", marginBottom: 12 }}>Rate y review</p>

        {/* Stars */}
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

        {/* Comment */}
        <textarea
          rows={4}
          placeholder="vreviewreviewreview..."
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

// ── Options dropdown ──────────────────────────────────────────────────────────
function OptionsMenu({ onReview, onToggleWatched, isWatched, onToggleHidden, isHidden, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const btn = (label, color, onClick) => (
    <button
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
        color: color ?? C.white,
        fontWeight: 600,
        ...MP,
      }}
    >
      {label}
    </button>
  );

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
      {btn("Review", C.white, onReview)}
      {btn(isWatched ? "Quitar de vistos" : "Agregar a vistos", C.white, onToggleWatched)}
      {btn(isHidden ? "Unhide" : "Hide", "#e05c5c", onToggleHidden)}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Movie() {
  const { id: tmdbId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "movie";
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = getUserId(user);

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [progress, setProgress] = useState({ season: 1, episode: 1 });
  const [pendingMovie, setPendingMovie] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const myReview = reviews.find((r) => r.user_id === userId) ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    load();
  }, [tmdbId, type]);

  async function load() {
    const [movieData, reviewData] = await Promise.all([fetchTmdbDetail(tmdbId, type), fetchReviews(tmdbId)]);
    setMovie(movieData);
    setReviews(reviewData);
    if (type === "tv") {
      const prog = await fetchProgress(tmdbId, userId);
      if (prog) setProgress({ season: prog.season, episode: prog.episode });
    }
    // AGREGAR:
    const [watchedRes, hiddenRes] = await Promise.all([checkWatched(userId, tmdbId), checkHidden(userId, tmdbId)]);
    setIsWatched(watchedRes.watched);
    setIsHidden(hiddenRes.hidden);
  }

  async function handleSubmitReview(rating, comment) {
    await submitReview(tmdbId, {
      user_id: userId,
      rating,
      comment,
      title: movie.title,
      year: movie.year,
      poster_url: movie.poster_url,
    });
    setShowReviewModal(false);
    setReviews(await fetchReviews(tmdbId));
  }

  async function handleDeleteReview() {
    await apiDeleteReview(tmdbId, userId);
    setReviews(await fetchReviews(tmdbId));
  }

  async function updateProgress(field, delta) {
    const next = { ...progress, [field]: Math.max(1, progress[field] + delta) };
    setProgress(next);
    await saveProgress(tmdbId, { user_id: userId, ...next, title: movie.title, year: movie.year, poster_url: movie.poster_url });
  }

  async function handleToggleWatched() {
    if (isWatched) {
      await unmarkWatched(userId, tmdbId);
      setIsWatched(false);
    } else {
      await markWatched({
        user_id: userId,
        tmdb_id: tmdbId,
        title: movie.title,
        year: movie.year,
        poster_url: movie.poster_url,
        media_type: type,
        genre_ids: movie.genre_ids ?? [],
      });
      setIsWatched(true);
    }
  }
  async function handleToggleHidden() {
    if (isHidden) {
      await unhideTitle(userId, tmdbId);
      setIsHidden(false);
    } else {
      await postHidden({
        user_id: userId,
        tmdb_id: tmdbId,
        title: movie.title,
        poster_url: movie.poster_url,
        media_type: type,
      });
      setIsHidden(true);
    }
  }
  if (!movie) {
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
      {/* ── Backdrop ── */}
      {movie.backdrop_url && (
        <div
          style={{
            height: 220,
            backgroundImage: `url(${movie.backdrop_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,15,20,0.2), #0d0f14)" }} />
          {/* Back button over backdrop */}
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

      {/* Back button when no backdrop */}
      {!movie.backdrop_url && (
        <div style={{ padding: "16px 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontWeight: 600, cursor: "pointer", ...MP }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* ── Hero: poster + info ── */}
        <div style={{ marginTop: movie.backdrop_url ? -60 : 16, position: "relative" }}>
          {/* Fila: poster + título + meta */}
          <div style={{ display: "flex", gap: 16, marginBottom: 0 }}>
            {movie.poster_url && (
              <img
                src={movie.poster_url}
                alt={movie.title}
                style={{ width: 100, flexShrink: 0, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", objectFit: "cover", alignSelf: "flex-start" }}
                className="sm:w-44"
              />
            )}
            <div style={{ flex: 1, minWidth: 0, paddingTop: movie.backdrop_url ? 70 : 0 }}>
              {/* Title + options */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <h1 style={{ color: C.white, fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 2rem)", lineHeight: 1.2, margin: 0, flex: 1 }}>{movie.title}</h1>
                {isWatched && (
                  <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke={C.yellow} strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
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
                  {showOptions && (
                    <OptionsMenu
                      onReview={() => setShowReviewModal(true)}
                      onToggleWatched={handleToggleWatched}
                      isWatched={isWatched}
                      onToggleHidden={handleToggleHidden}
                      isHidden={isHidden}
                      onClose={() => setShowOptions(false)}
                    />
                  )}
                </div>
              </div>
              {/* Meta */}
              <p style={{ color: C.gray, fontSize: 13, margin: 0, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span>{type === "tv" ? "Serie" : "Movie"}</span>
                {movie.runtime && (
                  <>
                    <span>•</span>
                    <span>{movie.runtime} min</span>
                  </>
                )}
                <span>•</span>
                <span>{movie.year}</span>
                <span>•</span>
                <span style={{ color: C.white }}>★ {movie.rating}</span>
              </p>
            </div>
          </div>

          {/* Bloque inferior mobile: overview, géneros, cast, botón — ancho completo */}
          <div className="sm:hidden" style={{ marginTop: 14 }}>
            {movie.overview && <p style={{ color: C.white, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{movie.overview}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {movie.genres.map((g) => (
                <span
                  key={g}
                  style={{ background: "rgba(255,255,255,0.08)", color: C.gray, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}
                >
                  {g}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
              {movie.director !== "N/A" && (
                <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Director: </span>
                  <Link to={`/peliculas/person?name=${encodeURIComponent(movie.director)}`} style={{ color: C.blue, textDecoration: "none" }}>
                    {movie.director}
                  </Link>
                </p>
              )}
              {movie.cast?.length > 0 && (
                <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>Cast: </span>
                  {movie.cast.map((a, i) => (
                    <span key={a}>
                      <Link to={`/peliculas/person?name=${encodeURIComponent(a)}`} style={{ color: C.blue, textDecoration: "none" }}>
                        {a}
                      </Link>
                      {i < movie.cast.length - 1 && ", "}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                setPendingMovie({ tmdb_id: movie.tmdb_id, title: movie.title, year: movie.year, poster_url: movie.poster_url, rating: movie.rating, type })
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
          </div>

          {/* Bloque desktop: overview, géneros, cast, botón — a la derecha del poster */}
          <div className="hidden sm:block" style={{ marginTop: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {movie.overview && <p style={{ color: C.white, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{movie.overview}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    style={{ background: "rgba(255,255,255,0.08)", color: C.gray, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}
                  >
                    {g}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                {movie.director !== "N/A" && (
                  <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>Director: </span>
                    <Link to={`/peliculas/person?name=${encodeURIComponent(movie.director)}`} style={{ color: C.blue, textDecoration: "none" }}>
                      {movie.director}
                    </Link>
                  </p>
                )}
                {movie.cast?.length > 0 && (
                  <p style={{ fontSize: 13, color: C.white, margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>Cast: </span>
                    {movie.cast.map((a, i) => (
                      <span key={a}>
                        <Link to={`/peliculas/person?name=${encodeURIComponent(a)}`} style={{ color: C.blue, textDecoration: "none" }}>
                          {a}
                        </Link>
                        {i < movie.cast.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setPendingMovie({ tmdb_id: movie.tmdb_id, title: movie.title, year: movie.year, poster_url: movie.poster_url, rating: movie.rating, type })
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
            </div>
          </div>
        </div>

        {/* ── Progress tracker (TV) ── */}
        {type === "tv" && (
          <div style={{ marginTop: 24, background: C.card, borderRadius: 16, padding: "16px 20px" }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Progreso</p>
            <div style={{ display: "flex", gap: 32 }}>
              <TrackerControl
                label="Temporada"
                value={progress.season}
                onDecrement={() => updateProgress("season", -1)}
                onIncrement={() => updateProgress("season", 1)}
              />
              <TrackerControl
                label="Episodio"
                value={progress.episode}
                onDecrement={() => updateProgress("episode", -1)}
                onIncrement={() => updateProgress("episode", 1)}
              />
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <div style={{ marginTop: 28 }}>
          <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 16 }}>Reviews</h2>

          {reviews.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "24px 0" }}>Sin reviews todavía</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.map((r) => (
                <div key={r.user_id} style={{ background: C.card, borderRadius: 14, padding: "14px 16px", position: "relative" }}>
                  {/* Header */}
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
                    {/* Delete button — solo el usuario actual */}
                    {r.user_id === userId && (
                      <button
                        onClick={handleDeleteReview}
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
                  {/* Stars + rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.comment ? 8 : 0 }}>
                    <Stars rating={r.rating} />
                    <span style={{ color: C.gray, fontSize: 12 }}>{r.rating}/10</span>
                  </div>
                  {/* Comment */}
                  {r.comment && <p style={{ color: C.white, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Gallery ── */}
        {movie.gallery?.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ color: C.white, fontWeight: 800, fontSize: "1.5rem", marginBottom: 12 }}>Galeria</h2>
            {/* Mobile: scroll horizontal */}
            <div
              className="sm:hidden"
              style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, margin: "0 -16px", padding: "0 16px 8px", scrollbarWidth: "none" }}
            >
              {movie.gallery.map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" style={{ height: 140, width: "auto", borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {movie.gallery.slice(0, 6).map((url, i) => (
                <img key={i} src={url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 10 }} />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* ── Full Cast ── */}
      <CastSection fullCast={movie.fullCast} navigate={navigate} />
      {/* ── Modals ── */}
      {pendingMovie && <AddToListModal movie={pendingMovie} onClose={() => setPendingMovie(null)} />}

      {showReviewModal && <ReviewModal existingReview={myReview} onSubmit={handleSubmitReview} onClose={() => setShowReviewModal(false)} />}
    </div>
  );
}

function TrackerControl({ label, value, onDecrement, onIncrement }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <p style={{ color: C.gray, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onDecrement}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: C.white,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <span style={{ color: C.white, fontWeight: 800, fontSize: 20, minWidth: 24, textAlign: "center" }}>{value}</span>
        <button
          onClick={onIncrement}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: C.white,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
