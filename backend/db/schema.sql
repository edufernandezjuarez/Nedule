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
  imdb_rating VARCHAR(10)
);

CREATE TABLE list_movies (
  list_id    INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  movie_id   INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  added_by   INTEGER REFERENCES users(id),
  added_at   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (list_id, movie_id)
);