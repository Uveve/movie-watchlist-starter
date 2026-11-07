import { Router } from 'express';
import { recommendationLimiter } from '../middleware/rate-limit.js';
import { getMovie, listMovies, recommendMovie } from '../controllers/movies.controller.js';

export const moviesRouter = Router();

moviesRouter.post('/recommend', recommendationLimiter, recommendMovie);
moviesRouter.get('/', listMovies);
moviesRouter.get('/:id', getMovie);
