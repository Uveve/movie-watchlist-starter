import { Router } from 'express';
import { getMovie, listMovies, recommendMovie } from '../controllers/movies.controller.js';

export const moviesRouter = Router();

moviesRouter.post('/recommend', recommendMovie);
moviesRouter.get('/', listMovies);
moviesRouter.get('/:id', getMovie);
