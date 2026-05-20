import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchWatching, saveProgress, deleteProgress, getUserId } from '../../api/index';

export default function Watching() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getUserId(user);
    fetchWatching(userId).then((data) => {
      setItems(data.map((item) => ({
        ...item,
        localSeason: item.season,
        localEpisode: item.episode,
      })));
      setLoading(false);
    });
  }, [user]);

  async function updateProgress(index, seasonDelta, episodeDelta) {
    const item = items[index];
    const newSeason = Math.max(1, item.localSeason + seasonDelta);
    const newEpisode = Math.max(1, item.localEpisode + episodeDelta);

    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, localSeason: newSeason, localEpisode: newEpisode } : it,
      ),
    );

    const userId = getUserId(user);
    const tmdbId = item.imdb_id.replace('tmdb_', '');
    await saveProgress(tmdbId, {
      user_id: userId,
      season: newSeason,
      episode: newEpisode,
    });
  }

  async function markDone(index) {
    const item = items[index];
    const userId = getUserId(user);
    await deleteProgress(item.movie_id, userId);
    setItems((prev) => prev.filter((_, i) => i !== index));
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
        <h1 className="text-lg font-bold text-content mb-4">Watching</h1>
        {items.length === 0 ? (
          <p className="text-content-muted text-sm text-center py-12">No series in progress</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const tmdbId = item.imdb_id.replace('tmdb_', '');
              return (
                <div
                  key={item.movie_id}
                  className="flex gap-3 bg-surface-alt rounded-2xl border border-white/[0.07] p-3"
                >
                  <img
                    src={item.poster_url ?? ''}
                    alt={item.title}
                    onClick={() => navigate(`/peliculas/movie/${tmdbId}?type=tv`)}
                    className="w-14 h-20 object-cover rounded-xl flex-shrink-0 bg-surface-alt cursor-pointer"
                  />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <p
                      onClick={() => navigate(`/peliculas/movie/${tmdbId}?type=tv`)}
                      className="font-medium text-content text-sm leading-snug cursor-pointer hover:text-accent transition-colors"
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-content-muted">Series · {item.year}</p>

                    {/* Tracker */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <WatchingCounter
                        label="Season"
                        value={item.localSeason}
                        onDecrement={() => updateProgress(index, -1, 0)}
                        onIncrement={() => updateProgress(index, 1, 0)}
                      />
                      <WatchingCounter
                        label="Episode"
                        value={item.localEpisode}
                        onDecrement={() => updateProgress(index, 0, -1)}
                        onIncrement={() => updateProgress(index, 0, 1)}
                      />
                      <button
                        onClick={() => markDone(index)}
                        className="text-xs bg-surface-alt text-content-muted px-3 py-1.5 rounded-xl hover:bg-surface transition-colors mt-auto"
                      >
                        ✓ Done
                      </button>
                    </div>
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

function WatchingCounter({ label, value, onDecrement, onIncrement }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] font-semibold text-content-muted uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrement}
          className="w-6 h-6 rounded-full bg-surface-alt text-content hover:bg-surface flex items-center justify-center text-sm"
        >
          −
        </button>
        <span className="text-sm font-bold text-content w-5 text-center">{value}</span>
        <button
          onClick={onIncrement}
          className="w-6 h-6 rounded-full bg-surface-alt text-content hover:bg-surface flex items-center justify-center text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
