import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const headers = { standardHeaders: 'draft-8', legacyHeaders: false };

export const loginLimiter = rateLimit({
  ...headers,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }
});

export const registerLimiter = rateLimit({
  ...headers,
  windowMs: 60 * 60 * 1000,
  limit: env.registrationRateLimit,
  message: { message: 'Terlalu banyak permintaan registrasi. Silakan coba lagi nanti.' }
});

export const recommendationLimiter = rateLimit({
  ...headers,
  windowMs: 60 * 1000,
  limit: 5,
  message: { message: 'Terlalu banyak permintaan rekomendasi. Silakan coba lagi nanti.' }
});
