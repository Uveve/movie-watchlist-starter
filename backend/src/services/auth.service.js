import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../database/connection.js';
import { AppError } from '../errors/app-error.js';

if (!env.jwtSecret || Buffer.byteLength(env.jwtSecret, 'utf8') < 32) {
  throw new Error('JWT_SECRET harus berisi kunci acak minimal 32 byte.');
}

// Akun yang tidak ditemukan tetap menjalani pemeriksaan hash yang mahal.
const dummyHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);

export async function register({ username, email, password }) {
  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)
    ON CONFLICT(email) DO NOTHING
  `).run(username, email, hash);
  if (!result.changes) throw new AppError(409, 'Email sudah terdaftar.');
  return { id: Number(result.lastInsertRowid), username, email };
}

export async function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const valid = await bcrypt.compare(password, user?.password_hash || dummyHash);
  if (!user || !valid) throw new AppError(401, 'Email atau password salah.');

  const token = jwt.sign({}, env.jwtSecret, {
    algorithm: 'HS256', subject: String(user.id), expiresIn: '1h',
    issuer: 'filmlog-api', audience: 'filmlog'
  });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
}
