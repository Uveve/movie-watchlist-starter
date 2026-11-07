import * as watchlistService from '../services/watchlist.service.js';
import { parseMovieId } from '../validators/movies.schemas.js';

export function listWatchlist(request, response) {
  response.status(200).json(watchlistService.listWatchlist(request.user.id));
}

export function addToWatchlist(request, response) {
  const entry = watchlistService.addToWatchlist(request.user.id, request.validatedBody.movieId);
  response.status(201).json(entry);
}

export function removeFromWatchlist(request, response) {
  const movieId = parseMovieId(request.params.movieId);
  watchlistService.removeFromWatchlist(request.user.id, movieId);
  response.status(204).end();
}
