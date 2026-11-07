import { AppError } from '../errors/app-error.js';

export function parseMovieId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    throw new AppError(400, 'ID film harus berupa bilangan bulat positif.');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(400, 'ID film tidak valid.');
  }
  return id;
}

export function parseMovieQuery(query) {
  for (const key of ['search', 'genre', 'shuffle']) {
    if (query[key] !== undefined && typeof query[key] !== 'string') {
      throw new AppError(400, `Parameter ${key} harus berupa satu nilai teks.`);
    }
  }
  const search = (query.search || '').trim();
  const genre = (query.genre || '').trim();
  if (search.length > 200 || genre.length > 50) {
    throw new AppError(400, 'Search maksimal 200 karakter dan genre maksimal 50 karakter.');
  }
  if (query.shuffle !== undefined && !['true', 'false'].includes(query.shuffle)) {
    throw new AppError(400, 'Shuffle harus bernilai true atau false.');
  }
  return { search, genre, shuffle: query.shuffle === 'true' };
}
