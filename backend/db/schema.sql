CREATE TABLE users (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO users (name) VALUES ('Edu'), ('Nicole');

CREATE TABLE lists (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  owner_id   INTEGER REFERENCES users(id),
  is_shared  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE movies (
  id          SERIAL PRIMARY KEY,
  imdb_id     VARCHAR(20) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  year        VARCHAR(10),
  poster_url  TEXT,
  imdb_rating VARCHAR(10),
  media_type VARCHAR(10) DEFAULT 'movie'
);

CREATE TABLE list_movies (
  list_id    INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  movie_id   INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  added_by   INTEGER REFERENCES users(id),
  added_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (list_id, movie_id)
);
CREATE TABLE reviews (
  id         SERIAL PRIMARY KEY,
  movie_id   INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id),
  rating     INTEGER CHECK (rating >= 1 AND rating <= 10),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (movie_id, user_id)
);
CREATE TABLE series_progress (
  id         SERIAL PRIMARY KEY,
  movie_id   INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id),
  season     INTEGER DEFAULT 1,
  episode    INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (movie_id, user_id)
);
CREATE TABLE hidden_titles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  tmdb_id    INTEGER NOT NULL,
  title      VARCHAR(255),
  poster_url TEXT,
  media_type VARCHAR(10) DEFAULT 'movie',
  hidden_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id)
);