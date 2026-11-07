import { db } from '../database/connection.js';
import { getMovie, serializeMovie } from './movies.service.js';

export function listWatched(userId) {
  const rows = db.prepare(`
    SELECT movies.*, reviews.id AS review_id, reviews.rating AS user_rating,
      reviews.review, reviews.created_at
    FROM reviews JOIN movies ON movies.id = reviews.movie_id
    WHERE reviews.user_id = ?
    ORDER BY reviews.id DESC
  `).all(userId);
  return rows.map(({ review_id, user_rating, review, created_at, ...movie }) => ({
    id: review_id, movie_id: movie.id, rating: user_rating, review, created_at,
    movie: serializeMovie(movie)
  }));
}

export function logWatched(userId, { movieId, rating, review }) {
  const movie = getMovie(movieId);
  const entry = db.prepare(`
    INSERT INTO reviews (user_id, movie_id, rating, review) VALUES (?, ?, ?, ?)
    RETURNING id, movie_id, rating, review, created_at
  `).get(userId, movieId, rating, review);
  return { ...entry, movie };
}
