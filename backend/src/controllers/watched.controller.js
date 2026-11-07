import * as watchedService from '../services/watched.service.js';

export function listWatched(request, response) {
  response.status(200).json(watchedService.listWatched(request.user.id));
}

export function logWatched(request, response) {
  const entry = watchedService.logWatched(request.user.id, request.validatedBody);
  response.status(201).json(entry);
}
