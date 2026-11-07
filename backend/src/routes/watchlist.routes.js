import { Router } from 'express';
import { listWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlist.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { parseWatchlist } from '../validators/watchlist.schemas.js';

export const watchlistRouter = Router();

watchlistRouter.use(authenticate);
watchlistRouter.get('/', listWatchlist);
watchlistRouter.post('/', validate(parseWatchlist), addToWatchlist);
watchlistRouter.delete('/:movieId', removeFromWatchlist);
