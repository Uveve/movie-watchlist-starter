import { AppError } from '../errors/app-error.js';
import { parseMovieId } from './movies.schemas.js';

export function parseWatchlist(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Body harus berupa objek JSON.');
  }
  return { movieId: parseMovieId(body.movieId) };
}
