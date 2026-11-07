import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 8000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT harus berupa angka antara 1 dan 65535.');
}

const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));
const databasePath = process.env.DB_PATH || 'storage/filmlog.sqlite';

const registrationRateLimit = Number(process.env.REGISTER_RATE_LIMIT || 5);
if (!Number.isSafeInteger(registrationRateLimit) || registrationRateLimit < 1) {
  throw new Error('REGISTER_RATE_LIMIT harus berupa bilangan bulat positif.');
}

export const env = {
  registrationRateLimit,
  jwtSecret: process.env.JWT_SECRET,
  databasePath: databasePath === ':memory:' ? databasePath : resolve(backendDirectory, databasePath),
  port,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
};
