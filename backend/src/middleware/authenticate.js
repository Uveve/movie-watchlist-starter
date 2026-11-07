import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../database/connection.js';
import { AppError } from '../errors/app-error.js';

export function authenticate(request, response, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(request.get('authorization') || '');
  if (!match) throw new AppError(401, 'Bearer token diperlukan.');

  let claims;
  try {
    claims = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ['HS256'], issuer: 'filmlog-api', audience: 'filmlog'
    });
  } catch {
    throw new AppError(401, 'Token tidak valid atau kedaluwarsa.');
  }
  const id = Number(claims.sub);
  if (typeof claims.sub !== 'string' || !/^[1-9][0-9]*$/.test(claims.sub) ||
      !Number.isSafeInteger(id) || !Number.isInteger(claims.exp)) {
    throw new AppError(401, 'Token tidak valid.');
  }
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError(401, 'Pengguna tidak ditemukan.');
  request.user = user;
  next();
}
