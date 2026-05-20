import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchTmdbSwipe, postHidden, fetchGenres, getUserId } from '../../api/index';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '../../hooks/useIsMobile';
import AddToListModal from '../../components/shared/AddToListModal';

const CURRENT_YEAR = new Date().getFullYear();

const CONTINENTS = [
  { key: 'northamerica', label: 'North America' },
  { key: 'southamerica', label: 'South America' },
  { key: 'europe', label: 'Europe' },
  { key: 'asia', label: 'Asia' },
  { key: 'middleeast', label: 'Middle East' },
  { key: 'africa', label: 'Africa' },
  { key: 'oceania', label: 'Oceania' },
];

const DEFAULT_FILTERS = {
  yearMin: 1900,
  yearMax: CURRENT_YEAR,
  genreIds: [],
  type: 'all',
  continents: [],
  countryName: '',
};

export default function Swipe() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAdd, setPendingAdd] = useState(null);

  const seenIds = useRef(new Set());
  const activeFiltersRef = useRef(DEFAULT_FILTERS);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [genres, setGenres] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);

  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setCurrent(null);
    const userId = getUserId(user);
    const f = activeFiltersRef.current;
    const params = { userId };
    if (f.yearMin !== 1900) params.yearMin = f.yearMin;
    if (f.yearMax !== CURRENT_YEAR) params.yearMax = f.yearMax;
    if (f.genreIds.length > 0) params.genreIds = f.genreIds.join(',');
    if (f.continents.length > 0) params.continents = f.continents.join(',');
    if (f.countryName) params.countryName = f.countryName;
    if (f.type !== 'all') params.type = f.type;
    if (seenIds.current.size > 0) params.exclude = [...seenIds.current].join(',');

    const data = await fetchTmdbSwipe(params);
    if (data && data.tmdb_id) {
      seenIds.current.add(data.tmdb_id);
    }
    setCurrent(data && data.tmdb_id ? data : null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGenres().then(setGenres);
    fetchNext();
  }, []);

  useEffect(() => {
    function handler(e) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [showFilterMenu, showFilterSheet]);

  function checkHasFilters(f) {
    return (
      f.yearMin !== 1900 ||
      f.yearMax !== CURRENT_YEAR ||
      f.genreIds.length > 0 ||
      f.continents.length > 0 ||
      f.countryName !== '' ||
      f.type !== 'all'
    );
  }

  function applyFilters(newFilters) {
    activeFiltersRef.current = newFilters;
    setFilters(newFilters);
    setHasActiveFilters(checkHasFilters(newFilters));
    setShowFilterMenu(false);
    setShowFilterSheet(false);
    seenIds.current = new Set();
    fetchNext();
  }

  function clearFilters() {
    applyFilters({ ...DEFAULT_FILTERS });
  }

  function toggleFilterOpen() {
    if (isMobile) {
      setShowFilterSheet(true);
    } else {
      setShowFilterMenu((v) => !v);
    }
  }

  function handleSkip() {
    fetchNext();
  }

  function handleAdd() {
    if (!current) return;
    setPendingAdd(current);
  }

  async function handleHide() {
    if (!current) return;
    const userId = getUserId(user);
    await postHidden({
      user_id: userId,
      tmdb_id: current.tmdb_id,
      title: current.title,
      poster_url: current.poster_url,
      media_type: current.type,
    });
    fetchNext();
  }

  function handleAddClose() {
    setPendingAdd(null);
    fetchNext();
  }

  function FilterPanel({ local, setLocal, onApply, onClear }) {
    return (
      <div className="flex flex-col gap-4">
        {/* Type */}
        <div>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">Type</p>
          <div className="flex gap-2">
            {['all', 'movie', 'tv'].map((t) => (
              <button
                key={t}
                onClick={() => setLocal((f) => ({ ...f, type: t }))}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  local.type === t
                    ? 'bg-accent text-white border-accent'
                    : 'border-white/[0.08] text-content hover:border-accent'
                }`}
              >
                {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
              </button>
            ))}
          </div>
        </div>

        {/* Year */}
        <div>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">
            Year: {local.yearMin} – {local.yearMax}
          </p>
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={1900}
              max={CURRENT_YEAR}
              value={local.yearMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setLocal((f) => ({ ...f, yearMin: Math.min(v, f.yearMax) }));
              }}
              className="w-full accent-accent"
            />
            <input
              type="range"
              min={1900}
              max={CURRENT_YEAR}
              value={local.yearMax}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setLocal((f) => ({ ...f, yearMax: Math.max(v, f.yearMin) }));
              }}
              className="w-full accent-accent"
            />
          </div>
        </div>

        {/* Genres */}
        <div>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">Genres</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  setLocal((f) => ({
                    ...f,
                    genreIds: f.genreIds.includes(g.id)
                      ? f.genreIds.filter((x) => x !== g.id)
                      : [...f.genreIds, g.id],
                  }))
                }
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  local.genreIds.includes(g.id)
                    ? 'bg-accent text-white border-accent'
                    : 'border-white/[0.08] text-content hover:border-accent'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wide mb-2">Region</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {CONTINENTS.map((c) => (
              <button
                key={c.key}
                onClick={() =>
                  setLocal((f) => ({
                    ...f,
                    continents: f.continents.includes(c.key)
                      ? f.continents.filter((x) => x !== c.key)
                      : [...f.continents, c.key],
                  }))
                }
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  local.continents.includes(c.key)
                    ? 'bg-accent text-white border-accent'
                    : 'border-white/[0.08] text-content hover:border-accent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Specific country…"
            value={local.countryName}
            onChange={(e) => setLocal((f) => ({ ...f, countryName: e.target.value }))}
            className="w-full bg-surface-alt text-content rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClear} className="flex-1 py-2.5 rounded-xl bg-surface-alt text-content text-sm">
            Clear
          </button>
          <button
            onClick={() => onApply(local)}
            className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-surface flex flex-col">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 px-4 py-2 bg-surface-alt border-b border-white/[0.08] text-sm shrink-0">
        <Link to="/peliculas" className="text-content-muted px-2 py-1 rounded-lg hover:bg-surface transition-colors">
          Lists
        </Link>
        <Link to="/peliculas/search" className="text-content-muted px-2 py-1 rounded-lg hover:bg-surface transition-colors">
          Search
        </Link>
        <Link to="/peliculas/cast" className="text-content-muted px-2 py-1 rounded-lg hover:bg-surface transition-colors">
          Cast
        </Link>
        <span className="font-medium text-content px-2 py-1 rounded-lg bg-surface">Swipe</span>
        <div className="ml-auto relative">
          <button
            ref={filterBtnRef}
            onClick={toggleFilterOpen}
            className={`px-3 py-1.5 rounded-xl border text-sm transition-colors ${
              hasActiveFilters
                ? 'bg-accent text-white border-accent'
                : 'border-white/[0.08] text-content hover:border-accent bg-surface-alt'
            }`}
          >
            ⚙
          </button>
          {!isMobile && showFilterMenu && (
            <div
              ref={filterMenuRef}
              className="absolute right-0 top-10 bg-surface-alt border border-white/[0.08] rounded-2xl shadow-xl p-5 z-30 w-80 max-h-[70vh] overflow-y-auto"
            >
              <FilterPanel
                local={localFilters}
                setLocal={setLocalFilters}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center p-4 gap-4 overflow-hidden min-h-0">
        {/* Card */}
        <div className="flex-1 min-h-0 w-full max-w-sm">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-content-muted">Loading…</p>
            </div>
          ) : !current ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 rounded-2xl bg-surface-alt">
              <p className="text-content-muted text-center px-6 text-sm">
                No more results with these filters
              </p>
              <button
                onClick={() => {
                  seenIds.current = new Set();
                  fetchNext();
                }}
                className="px-5 py-2.5 rounded-xl bg-surface text-content text-sm"
              >
                Reset session
              </button>
            </div>
          ) : (
            <div className="relative h-full rounded-2xl overflow-hidden">
              <img
                src={current.poster_url}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {current.type === 'tv' ? 'TV' : 'Movie'}
                  </span>
                  <span className="text-white/60 text-xs">★ {current.rating}</span>
                  <span className="text-white/60 text-xs">· {current.year}</span>
                </div>
                <h2 className="text-white text-xl font-bold leading-tight">{current.title}</h2>
                {current.overview && (
                  <p className="text-white/60 text-sm mt-2 line-clamp-3">{current.overview}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="shrink-0 flex gap-3 w-full max-w-sm">
          <button
            onClick={handleSkip}
            disabled={loading || !current}
            className="flex-1 py-4 rounded-2xl bg-surface-alt text-2xl disabled:opacity-40 transition-all hover:bg-surface-alt/70 active:scale-95"
          >
            ❌
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !current}
            className="flex-1 py-4 rounded-2xl bg-accent text-2xl disabled:opacity-40 transition-all hover:bg-accent/80 active:scale-95"
          >
            ✓
          </button>
          <button
            onClick={handleHide}
            disabled={loading || !current}
            className="flex-1 py-4 rounded-2xl bg-surface-alt text-2xl disabled:opacity-40 transition-all hover:bg-surface-alt/70 active:scale-95"
          >
            🚫
          </button>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {isMobile && showFilterSheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowFilterSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-alt rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/[0.08]">
              <span className="font-semibold text-content">Filters</span>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="text-content-muted text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <FilterPanel
                local={localFilters}
                setLocal={setLocalFilters}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            </div>
          </div>
        </>
      )}

      {/* Add to list modal */}
      {pendingAdd && <AddToListModal movie={pendingAdd} onClose={handleAddClose} />}
    </div>
  );
}
