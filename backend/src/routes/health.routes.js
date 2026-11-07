import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (request, response) => {
  response.status(200).json({ status: 'ok', service: 'filmlog-api' });
});
