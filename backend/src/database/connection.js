import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

if (env.databasePath !== ':memory:') {
  mkdirSync(dirname(env.databasePath), { recursive: true });
}

export const db = new DatabaseSync(env.databasePath);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  PRAGMA journal_mode = WAL;
`);
