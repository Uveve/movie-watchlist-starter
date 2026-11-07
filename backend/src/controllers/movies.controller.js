import * as moviesService from '../services/movies.service.js';
import { parseMovieId, parseMovieQuery } from '../validators/movies.schemas.js';

export function listMovies(request, response) {
  const query = parseMovieQuery(request.query);
  response.status(200).json(moviesService.listMovies(query));
}

export function getMovie(request, response) {
  const id = parseMovieId(request.params.id);
  response.status(200).json(moviesService.getMovie(id));
}
