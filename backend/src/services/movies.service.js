import { randomInt } from 'node:crypto';
import { db } from '../database/connection.js';
import { AppError } from '../errors/app-error.js';

export function serializeMovie(row) {
  return { ...row, genres: JSON.parse(row.genres), cast: JSON.parse(row.cast) };
}

export function listMovies({ search, genre, shuffle }) {
  const movies = db.prepare(`
    SELECT * FROM movies
    WHERE (? = '' OR instr(lower(title), lower(?)) > 0 OR instr(lower(director), lower(?)) > 0)
      AND (? = '' OR EXISTS (
        SELECT 1 FROM json_each(movies.genres) WHERE lower(value) = lower(?)
      ))
    ORDER BY id
  `).all(search, search, search, genre, genre).map(serializeMovie);

  if (shuffle) {
    for (let i = movies.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [movies[i], movies[j]] = [movies[j], movies[i]];
    }
  }
  return movies;
}

export function getMovie(id) {
  const row = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  if (!row) throw new AppError(404, 'Film tidak ditemukan.');
  return serializeMovie(row);
}
