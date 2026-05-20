import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchHidden, unhideTitle, getUserId } from '../../api/index';

export default function Hidden() {
  const { user } = useAuth();
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-content-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-lg font-bold text-content mb-4">Hidden titles</h1>
        {titles.length === 0 ? (
          <p className="text-content-muted text-sm text-center py-12">No hidden titles</p>
        ) : (
          <div className="flex flex-col gap-2">
            {titles.map((t) => (
              <div
                key={t.tmdb_id}
                className="flex items-center gap-3 bg-surface-alt rounded-2xl border border-white/[0.07] p-3"
              >
                <img
                  src={t.poster_url ?? ''}
                  alt={t.title}
                  className="w-12 h-16 object-cover rounded-xl flex-shrink-0 bg-surface-alt"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-content text-sm truncate">{t.title}</p>
                  <p className="text-xs text-content-muted">
                    {t.media_type === 'tv' ? 'Series' : 'Movie'}
                  </p>
                </div>
                <button
                  onClick={() => handleUnhide(t.tmdb_id)}
                  className="flex-shrink-0 text-xs border border-white/[0.08] text-content px-3 py-1.5 rounded-xl hover:bg-surface transition-colors"
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
