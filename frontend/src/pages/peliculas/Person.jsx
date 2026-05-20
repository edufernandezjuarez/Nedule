import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchPerson, searchPersonByName } from '../../api/index';
import MovieCard from '../../components/shared/MovieCard';

export default function Person() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const personIdParam = searchParams.get('id');
  const personName = searchParams.get('name');

  const [person, setPerson] = useState(null);
  const [allCredits, setAllCredits] = useState([]);
  const [activeTab, setActiveTab] = useState('movie');
  const [isLoading, setIsLoading] = useState(false);

  const personIdRef = useRef(personIdParam);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    init();
  }, [personIdParam, personName]);

  async function init() {
    setAllCredits([]);
    pageRef.current = 1;
    setPerson(null);

    let id = personIdParam;

    if (!id && personName) {
      const data = await searchPersonByName(personName);
      if (!data?.id) {
        setPerson({ name: 'Person not found', photo_url: null, known_for: '' });
        return;
      }
      id = data.id;
      // Update URL to use the ID from now on
      navigate(`/peliculas/person?id=${id}`, { replace: true });
    }

    if (!id) return;
    personIdRef.current = id;
    await loadPage(id, true);
  }

  async function loadPage(id, reset = false) {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    const data = await fetchPerson(id ?? personIdRef.current, pageRef.current);

    if (reset) {
      setPerson({
        name: data.name,
        photo_url: data.photo_url,
        known_for: data.known_for,
      });
      setAllCredits(data.credits);
    } else {
      setAllCredits((prev) => [...prev, ...data.credits]);
    }

    hasMoreRef.current = data.hasMore;

    if (data.hasMore) {
      setupSentinel();
    } else {
      removeSentinel();
    }

    isLoadingRef.current = false;
    setIsLoading(false);
  }

  function setupSentinel() {
    removeSentinel();
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          pageRef.current++;
          loadPage(personIdRef.current);
        }
      },
      { threshold: 1.0 },
    );
    observerRef.current.observe(sentinelRef.current);
  }

  function removeSentinel() {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }

  async function handleTabSwitch(tab) {
    // If there are still pages to load, fetch all remaining before filtering
    if (hasMoreRef.current) {
      removeSentinel();
      let currentPage = pageRef.current;
      let credits = [...allCredits];
      while (hasMoreRef.current) {
        currentPage++;
        const data = await fetchPerson(personIdRef.current, currentPage);
        credits = [...credits, ...data.credits];
        hasMoreRef.current = data.hasMore;
      }
      pageRef.current = currentPage;
      setAllCredits(credits);
    }
    setActiveTab(tab);
  }

  const filteredCredits = allCredits.filter((c) => c.type === activeTab);

  if (!person) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-content-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-surface-alt border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 py-6 flex gap-5 items-start">
          {/* Photo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-alt">
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-content-muted">
                {person.name[0]}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-content">{person.name}</h1>
            {person.known_for && (
              <p className="text-sm text-content-muted mt-0.5">{person.known_for}</p>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex max-w-2xl mx-auto px-4">
          <button
            onClick={() => handleTabSwitch('movie')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'movie'
                ? 'border-accent text-accent'
                : 'border-transparent text-content-muted hover:text-content'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => handleTabSwitch('tv')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tv'
                ? 'border-accent text-accent'
                : 'border-transparent text-content-muted hover:text-content'
            }`}
          >
            Series
          </button>
        </div>
      </div>

      {/* Credits grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {filteredCredits.length === 0 && !isLoading ? (
          <p className="text-content-muted text-sm text-center py-12">
            No {activeTab === 'movie' ? 'movies' : 'series'} found
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
            {filteredCredits.map((item) => (
              <MovieCard key={`${item.tmdb_id}_${item.type}`} movie={item} />
            ))}
          </div>
        )}
        {isLoading && (
          <p className="text-content-muted text-sm text-center py-6">Loading…</p>
        )}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
