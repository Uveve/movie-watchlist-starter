import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.routes.js';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { moviesRouter } from './routes/movies.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '16kb' }));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);

const frontendDirectory = fileURLToPath(new URL('../../frontend/', import.meta.url));
const seedFile = fileURLToPath(new URL('../../data/movies.json', import.meta.url));

app.use(express.static(frontendDirectory));
app.get('/data/movies.json', (request, response) => response.sendFile(seedFile));

app.use(notFound);
app.use(errorHandler);
