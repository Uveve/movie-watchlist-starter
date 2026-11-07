const port = Number(process.env.PORT || 8000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT harus berupa angka antara 1 dan 65535.');
}

export const env = {
  port,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
};
