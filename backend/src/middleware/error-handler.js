export function notFound(request, response) {
  response.status(404).json({ message: 'Endpoint tidak ditemukan.' });
}

// Express mengenali error handler dari empat parameter ini.
export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ message: 'Body harus berupa JSON yang valid.' });
  }

  if (error.type === 'entity.too.large') {
    return response.status(413).json({ message: 'Request terlalu besar.' });
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;

  if (status === 401) response.setHeader('WWW-Authenticate', 'Bearer');

  if (status === 500) console.error(error);

  response.status(status).json({
    message: status === 500 ? 'Terjadi kesalahan server.' : error.message
  });
}
