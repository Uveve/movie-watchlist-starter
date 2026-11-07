import { db } from '../database/connection.js';
import { AppError } from '../errors/app-error.js';
import { getMovie, serializeMovie } from './movies.service.js';

export function listWatchlist(userId) {
  const rows = db.prepare(`
    SELECT movies.*, watchlists.created_at
    FROM watchlists JOIN movies ON movies.id = watchlists.movie_id
    WHERE watchlists.user_id = ?
    ORDER BY watchlists.created_at DESC, watchlists.movie_id DESC
  `).all(userId);
  return rows.map(({ created_at, ...movie }) => ({
    movie_id: movie.id, created_at, movie: serializeMovie(movie)
  }));
}

export function addToWatchlist(userId, movieId) {
  const movie = getMovie(movieId);
  const entry = db.prepare(`
    INSERT INTO watchlists (user_id, movie_id) VALUES (?, ?)
    ON CONFLICT(user_id, movie_id) DO NOTHING
    RETURNING movie_id, created_at
  `).get(userId, movieId);
  if (!entry) throw new AppError(409, 'Film sudah ada di watchlist.');
  return { ...entry, movie };
}

export function removeFromWatchlist(userId, movieId) {
  const result = db.prepare('DELETE FROM watchlists WHERE user_id = ? AND movie_id = ?')
    .run(userId, movieId);
  if (!result.changes) throw new AppError(404, 'Film tidak ada di watchlist kamu.');
}
