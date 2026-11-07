CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL CHECK (length(trim(username)) > 0),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  director TEXT NOT NULL,
  genres TEXT NOT NULL CHECK (json_valid(genres) AND json_type(genres) = 'array'),
  rating REAL NOT NULL CHECK (rating BETWEEN 0 AND 10),
  duration TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  cast TEXT NOT NULL CHECK (json_valid("cast") AND json_type("cast") = 'array')
);

CREATE TABLE watchlists (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX watchlists_movie_id ON watchlists(movie_id);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (typeof(rating) = 'integer' AND rating BETWEEN 1 AND 5),
  review TEXT NOT NULL CHECK (length(trim(review)) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX reviews_user_history ON reviews(user_id, id DESC);
CREATE INDEX reviews_movie_id ON reviews(movie_id);
