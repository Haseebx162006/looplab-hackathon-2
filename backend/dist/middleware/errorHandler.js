export function errorHandler(err, _req, res, _next) {
    console.error('[Error]:', err.stack || err.message || err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        success: false,
        error: message,
    });
}
