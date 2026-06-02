import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import PersonalRoute from "./components/shared/PersonalRoute";
import PeliculasLayout from "./components/shared/PeliculasLayout";

import Login from "./pages/auth/Login";
import Profile from "./pages/peliculas/Profile";

import PeliculasIndex from "./pages/peliculas/PeliculasIndex";
import Lists from "./pages/peliculas/Lists";
import IMDB from "./pages/peliculas/IMDB";
import Movie from "./pages/peliculas/Movie";
import Serie from "./pages/peliculas/Serie";
import Episode from "./pages/peliculas/Episode";
import Person from "./pages/peliculas/Person";
import Cast from "./pages/peliculas/Cast";
import Swipe from "./pages/peliculas/Swipe";
import Reviews from "./pages/peliculas/Reviews";
import Watched from "./pages/peliculas/Watched";
import Hidden from "./pages/peliculas/Hidden";
import Watching from "./pages/peliculas/Watching";

import Juegos from "./pages/juegos/index";
import Personal from "./pages/personal/index";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/peliculas" replace />} />

        <Route element={<PeliculasLayout />}>
          <Route path="/peliculas" element={<PeliculasIndex />} />
          <Route path="/peliculas/listas" element={<Lists />} />

          {/* Buscador — mantiene IMDB montado cuando navegás a película/serie desde acá */}
          <Route path="/peliculas/search" element={<IMDB />}>
            <Route path="movie/:id" element={<Movie />} />
            <Route path="tv/:id" element={<Serie />}>
              <Route path="season/:season/episode/:ep" element={<Episode />} />
            </Route>
          </Route>

          {/* Rutas independientes — desde listas, cast, swipe, etc. */}
          <Route path="/peliculas/movie/:id" element={<Movie />} />
          <Route path="/peliculas/tv/:id" element={<Serie />}>
            <Route path="season/:season/episode/:ep" element={<Episode />} />
          </Route>
          <Route path="/peliculas/watching" element={<Watching />} />
          <Route path="/peliculas/hidden" element={<Hidden />} />

          {/* Swipe */}
          <Route path="/peliculas/swipe" element={<Swipe />}>
            <Route path="movie/:id" element={<Movie />} />
            <Route path="tv/:id" element={<Serie />}>
              <Route path="season/:season/episode/:ep" element={<Episode />} />
            </Route>
          </Route>

          <Route path="/peliculas/profile" element={<Profile />} />
          <Route path="/peliculas/person" element={<Person />} />
          <Route path="/peliculas/cast" element={<Cast />} />
          <Route path="/peliculas/reviews" element={<Reviews />} />
          <Route path="/peliculas/watched" element={<Watched />} />
        </Route>

        <Route path="/juegos/*" element={<Juegos />} />
        <Route element={<PersonalRoute />}>
          <Route path="/personal/*" element={<Personal />} />
        </Route>
      </Route>
    </Routes>
  );
}
