import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '16kb' }));

app.use('/api/health', healthRouter);

app.use(notFound);
app.use(errorHandler);
