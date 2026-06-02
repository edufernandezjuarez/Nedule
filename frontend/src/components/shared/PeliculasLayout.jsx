import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

const C = {
  bg: "#0d0f14",
  navbar: "#101b31",
  yellow: "#f5c518",
  white: "#ffffff",
  gray: "#7a7a7a",
};
const MP = { fontFamily: "'Maven Pro', sans-serif" };

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={active ? C.yellow : C.gray} strokeWidth={2}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinejoin="round" />
    </svg>
  );
}
function SwipeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={active ? C.yellow : C.gray} strokeWidth={2}>
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SearchIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={active ? C.yellow : C.gray} strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
function ListIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke={active ? C.yellow : C.gray} strokeWidth={2}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill={active ? C.yellow : C.gray} stroke="none" />
      <circle cx="3" cy="12" r="1" fill={active ? C.yellow : C.gray} stroke="none" />
      <circle cx="3" cy="18" r="1" fill={active ? C.yellow : C.gray} stroke="none" />
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/peliculas", label: "Home", end: true },
  { to: "/peliculas/listas", label: "Listas", end: false },
  { to: "/peliculas/search", label: "Buscar", end: false },
  { to: "/peliculas/swipe", label: "Swipe", end: false },
];

export default function PeliculasLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // FIX: un solo ref que cubre tanto el botón como el dropdown en desktop
  const desktopMenuRef = useRef(null);
  // FIX: ref separado para mobile que cubre botón + dropdown
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      const inDesktop = desktopMenuRef.current?.contains(e.target);
      const inMobile = mobileMenuRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleProfile() {
    navigate("/peliculas/profile");
    setShowUserMenu(false);
  }

  function handleReviews() {
    navigate("/peliculas/reviews");
    setShowUserMenu(false);
  }

  function handleWatching() {
    navigate("/peliculas/watching");
    setShowUserMenu(false);
  }

  function handleHidden() {
    navigate("/peliculas/hidden");
    setShowUserMenu(false);
  }

  function handleWatched() {
    navigate("/peliculas/watched");
    setShowUserMenu(false);
  }
  const initial = user?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, ...MP }}>
      {/* ── Desktop Navbar ── */}
      <header
        className="hidden sm:flex items-center gap-2 px-6 py-3 sticky top-0 z-40"
        style={{ background: C.navbar, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Logo */}
        <NavLink to="/peliculas" end className="flex items-center gap-2 mr-4 flex-shrink-0" style={{ textDecoration: "none" }}>
          <span style={{ color: "#e05c5c", fontSize: "1.5rem", lineHeight: 1 }}>♥</span>
          <span style={{ color: C.white, fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.3px", ...MP }}>Nedule</span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                ...MP,
                textDecoration: "none",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.92rem",
                padding: "6px 14px",
                borderRadius: "8px",
                color: isActive ? C.white : C.gray,
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                transition: "color 0.15s, background 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* FIX: ref cubre el botón Y el dropdown juntos */}
        <div className="relative ml-auto flex-shrink-0" ref={desktopMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            style={{ background: C.yellow }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: C.navbar, color: C.white, ...MP }}
            >
              {initial}
            </span>
            <span style={{ color: C.navbar, fontWeight: 700, fontSize: "0.9rem", ...MP }}>{user}</span>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-11 rounded-xl shadow-2xl py-1 min-w-[170px] z-50"
              style={{ background: "#151c2e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={handleProfile}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: C.white, fontWeight: 600, ...MP }}
              >
                {user}
              </button>
              <button
                onClick={handleReviews}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: C.gray, ...MP }}
              >
                Historial reviews
              </button>
              <button
                onClick={handleWatched}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: C.gray, ...MP }}
              >
                Vistos
              </button>
              <button
                onClick={handleWatching}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: C.gray, ...MP }}
              >
                Mirando
              </button>
              <button
                onClick={handleHidden}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: C.gray, ...MP }}
              >
                Hidden
              </button>
              <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: "#e05c5c", ...MP }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 pb-20 sm:pb-0" style={{ background: C.bg }}>
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      {/* FIX: ref cubre toda la nav incluyendo el botón de usuario y el dropdown */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ background: C.navbar, borderTop: "1px solid rgba(255,255,255,0.06)" }}
        ref={mobileMenuRef}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { to: "/peliculas", label: "Home", Icon: HomeIcon, end: true },
            { to: "/peliculas/swipe", label: "Swipe", Icon: SwipeIcon, end: false },
            { to: "/peliculas/search", label: "Buscar", Icon: SearchIcon, end: false },
            { to: "/peliculas/listas", label: "Listas", Icon: ListIcon, end: false },
          ].map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl"
              style={({ isActive }) => ({ color: isActive ? C.yellow : C.gray })}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: isActive ? "rgba(245,197,24,0.12)" : "transparent" }}
                  >
                    <Icon active={isActive} />
                  </span>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, ...MP }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Usuario */}
          <button onClick={() => setShowUserMenu((v) => !v)} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: C.yellow, color: C.navbar, ...MP }}
              >
                {initial}
              </span>
            </span>
            <span style={{ fontSize: 10, fontWeight: 500, color: C.gray, ...MP }}>Usuario</span>
          </button>
        </div>

        {/* Mobile user menu — dentro del mismo ref */}
        {showUserMenu && (
          <div
            className="absolute bottom-full left-0 right-0 rounded-t-2xl shadow-2xl py-2"
            style={{ background: "#151c2e", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button onClick={handleProfile} className="w-full text-left px-5 py-3 text-sm font-semibold hover:bg-white/5" style={{ color: C.white, ...MP }}>
              {user}
            </button>
            <button onClick={handleReviews} className="w-full text-left px-5 py-3 text-sm hover:bg-white/5" style={{ color: C.gray, ...MP }}>
              Historial reviews
            </button>
            <button onClick={handleWatched} className="w-full text-left px-5 py-3 text-sm hover:bg-white/5" style={{ color: C.gray, ...MP }}>
              Vistos
            </button>
            <button onClick={handleWatching} className="w-full text-left px-5 py-3 text-sm hover:bg-white/5" style={{ color: C.gray, ...MP }}>
              Mirando
            </button>
            <button onClick={handleHidden} className="w-full text-left px-5 py-3 text-sm hover:bg-white/5" style={{ color: C.gray, ...MP }}>
              Hidden
            </button>
            <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm hover:bg-white/5" style={{ color: "#e05c5c", ...MP }}>
              Log out
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
