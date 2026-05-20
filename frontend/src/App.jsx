import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import PersonalRoute from "./components/shared/PersonalRoute";
import PeliculasLayout from "./components/shared/PeliculasLayout";

import Login from "./pages/auth/Login";
import Profile from "./pages/Profile";

import PeliculasIndex from "./pages/peliculas/PeliculasIndex";
import Lists from "./pages/peliculas/Lists";
import IMDB from "./pages/peliculas/IMDB";
import Movie from "./pages/peliculas/Movie";
import Person from "./pages/peliculas/Person";
import Cast from "./pages/peliculas/Cast";
import Swipe from "./pages/peliculas/Swipe";
import Reviews from "./pages/peliculas/Reviews";
import Watching from "./pages/peliculas/Watching";
import Hidden from "./pages/peliculas/Hidden";

import Juegos from "./pages/juegos/index";
import Personal from "./pages/personal/index";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — todas las rutas requieren auth */}
      <Route element={<ProtectedRoute />}>
        {/* / → redirige a peliculas */}
        <Route path="/" element={<Navigate to="/peliculas" replace />} />

        {/* ── Películas (con su propio layout + navbar) ── */}
        <Route element={<PeliculasLayout />}>
          <Route path="/peliculas" element={<PeliculasIndex />} />
          <Route path="/peliculas/listas" element={<Lists />} />
          <Route path="/peliculas/search" element={<IMDB />}>
            <Route path="movie/:id" element={<Movie />} />
          </Route>
          <Route path="/peliculas/person" element={<Person />} />
          <Route path="/peliculas/cast" element={<Cast />} />
          <Route path="/peliculas/swipe" element={<Swipe />} />
          {/* User pages — dentro del layout de pelis */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/watching" element={<Watching />} />
          <Route path="/hidden" element={<Hidden />} />
        </Route>

        {/* ── Juegos (layout propio a futuro) ── */}
        <Route path="/juegos/*" element={<Juegos />} />

        {/* ── Personal (Edu y Nicole only) ── */}
        <Route element={<PersonalRoute />}>
          <Route path="/personal/*" element={<Personal />} />
        </Route>
      </Route>
    </Routes>
  );
}
