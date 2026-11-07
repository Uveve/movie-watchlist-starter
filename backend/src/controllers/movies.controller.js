import { recommend } from '../services/gemini.service.js';
import { AppError } from '../errors/app-error.js';
import { readFileSync } from 'node:fs';

const seedIds = new Set(JSON.parse(readFileSync(new URL('../../../data/movies.json', import.meta.url), 'utf8')).map(movie => movie.id));
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

export async function recommendMovie(request, response) {
  const prompt = request.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.trim().length > 1000) {
    throw new AppError(400, 'Prompt harus memiliki 1–1000 karakter.');
  }
  const catalog = moviesService.listMovies({ search: '', genre: '', shuffle: false })
    .filter(movie => seedIds.has(movie.id))
    .map(({ id, title, genres, synopsis, rating }) => ({
      id, title, genres, synopsis, catalog_rating: rating
    }));
  if (!catalog.length) throw new AppError(503, 'Katalog rekomendasi kosong.');
  const recommendation = await recommend(prompt.trim(), catalog);
  if (!recommendation) {
    throw new AppError(422, 'FilmLog hanya melayani rekomendasi film dari katalog.');
  }
  response.status(200).json(recommendation);
}
