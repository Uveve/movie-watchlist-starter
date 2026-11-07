import { Router } from 'express';
import { getMovie, listMovies } from '../controllers/movies.controller.js';

export const moviesRouter = Router();

moviesRouter.get('/', listMovies);
moviesRouter.get('/:id', getMovie);
