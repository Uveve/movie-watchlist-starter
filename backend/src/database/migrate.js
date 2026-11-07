import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';

export function migrate() {
  const directory = new URL('./migrations/', import.meta.url);
  const files = readdirSync(directory).filter(file => file.endsWith('.sql')).sort();

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`);
    const applied = db.prepare('SELECT name FROM schema_migrations WHERE name = ?');
    const record = db.prepare('INSERT INTO schema_migrations (name) VALUES (?)');

    for (const file of files) {
      if (applied.get(file)) continue;
      db.exec(readFileSync(new URL(file, directory), 'utf8'));
      record.run(file);
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
    console.log('Migrasi database selesai.');
  } finally {
    db.close();
  }
}
