import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';
import { migrate } from './migrate.js';

export function seedMovies() {
  const movies = JSON.parse(readFileSync(new URL('../../../data/movies.json', import.meta.url), 'utf8'));
  const insert = db.prepare(`
    INSERT INTO movies (id, title, year, director, genres, rating, duration, synopsis, poster_url, cast)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const movie of movies) {
      insert.run(movie.id, movie.title, movie.year, movie.director, JSON.stringify(movie.genres),
        movie.rating, movie.duration, movie.synopsis, movie.poster_url, JSON.stringify(movie.cast));
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    migrate();
    seedMovies();
    console.log('Seed film selesai.');
  } finally {
    db.close();
  }
}
