import * as authService from '../services/auth.service.js';

export async function register(request, response) {
  const user = await authService.register(request.validatedBody);
  response.status(201).json({ user });
}

export async function login(request, response) {
  const result = await authService.login(request.validatedBody);
  response.status(200).json(result);
}
