import { AppError } from '../errors/app-error.js';

function parseCredentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Body harus berupa objek JSON.');
  }
  if (typeof body.email !== 'string' || body.email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw new AppError(400, 'Email tidak valid.');
  }
  if (typeof body.password !== 'string' || body.password.length === 0 ||
      Buffer.byteLength(body.password, 'utf8') > 72) {
    throw new AppError(400, 'Password harus diisi dan maksimal 72 byte UTF-8.');
  }
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

export function parseRegister(body) {
  const credentials = parseCredentials(body);
  if (typeof body.username !== 'string' || !body.username.trim() || body.username.trim().length > 50) {
    throw new AppError(400, 'Username harus memiliki 1–50 karakter.');
  }
  if (credentials.password.length < 8) {
    throw new AppError(400, 'Password minimal 8 karakter.');
  }
  return { ...credentials, username: body.username.trim() };
}

export function parseLogin(body) {
  return parseCredentials(body);
}
