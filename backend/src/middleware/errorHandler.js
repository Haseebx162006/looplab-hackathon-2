export function errorHandler(err, _req, res, _next) {
  console.error('[Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
