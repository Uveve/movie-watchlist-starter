import { app } from './app.js';
import { env } from './config/env.js';

import { db } from './database/connection.js';
import { migrate } from './database/migrate.js';

migrate();

const server = app.listen(env.port, () => {
  console.log(`FilmLog API tersedia di http://localhost:${env.port}`);
});

server.on('error', error => {
  console.error('Server gagal dijalankan:', error.message);
  db.close();
  process.exitCode = 1;
});

function shutdown() {
  server.close(error => {
    db.close();
    if (error) {
      console.error('Server gagal dihentikan:', error.message);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
