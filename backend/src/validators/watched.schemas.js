import { AppError } from '../errors/app-error.js';
import { parseMovieId } from './movies.schemas.js';

export function parseWatched(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Body harus berupa objek JSON.');
  }
  const movieId = parseMovieId(body.movieId);
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    throw new AppError(400, 'Rating harus berupa bilangan bulat 1–5.');
  }
  if (typeof body.review !== 'string' || !body.review.trim() ||
      body.review.trim().length > 2000 || body.review.includes('\0')) {
    throw new AppError(400, 'Ulasan harus memiliki 1–2000 karakter dan tidak boleh mengandung karakter null.');
  }
  return { movieId, rating: body.rating, review: body.review.trim() };
}
