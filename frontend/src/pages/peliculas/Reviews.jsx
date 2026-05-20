import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchUserReviews, getUserId } from '../../api/index';

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getUserId(user);
    fetchUserReviews(userId).then((data) => {
      setReviews(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-content-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold text-content mb-4">Review history</h1>
        {reviews.length === 0 ? (
          <p className="text-content-muted text-sm text-center py-12">No reviews yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => {
              const tmdbId = r.imdb_id.replace('tmdb_', '');
              const type = r.media_type ?? 'movie';
              return (
                <div
                  key={r.id}
                  onClick={() => navigate(`/peliculas/movie/${tmdbId}?type=${type}`)}
                  className="flex gap-3 bg-surface-alt rounded-2xl border border-white/[0.07] p-3 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <img
                    src={r.poster_url ?? ''}
                    alt={r.title}
                    className="w-14 h-20 object-cover rounded-xl flex-shrink-0 bg-surface-alt"
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-medium text-content text-sm leading-snug">{r.title}</p>
                    <p className="text-xs text-content-muted">
                      {r.year} · {type === 'tv' ? 'Series' : 'Movie'}
                    </p>
                    <p className="text-sm text-yellow-400">
                      {'★'.repeat(r.rating)}
                      <span className="text-content-muted/30">{'★'.repeat(10 - r.rating)}</span>
                      <span className="text-xs text-content-muted ml-1">{r.rating}/10</span>
                    </p>
                    {r.comment && (
                      <p className="text-xs text-content-muted line-clamp-2">{r.comment}</p>
                    )}
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
