import { Router } from 'express';
import { listWatched, logWatched } from '../controllers/watched.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { parseWatched } from '../validators/watched.schemas.js';

export const watchedRouter = Router();

watchedRouter.use(authenticate);
watchedRouter.get('/', listWatched);
watchedRouter.post('/', validate(parseWatched), logWatched);
