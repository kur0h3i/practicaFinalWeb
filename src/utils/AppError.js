export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'APP_ERROR'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(msg, code = 'BAD_REQUEST') { return new AppError(msg, 400, code) }
  static unauthorized(msg = 'No autorizado', code = 'UNAUTHORIZED') { return new AppError(msg, 401, code) }
  static forbidden(msg = 'Acceso denegado', code = 'FORBIDDEN') { return new AppError(msg, 403, code) }
  static notFound(msg = 'No encontrado', code = 'NOT_FOUND') { return new AppError(msg, 404, code) }
  static conflict(msg, code = 'CONFLICT') { return new AppError(msg, 409, code) }
  static tooManyRequests(msg = 'Demasiados intentos', code = 'TOO_MANY_REQUESTS') { return new AppError(msg, 429, code) }
  static internal(msg = 'Error interno', code = 'INTERNAL_ERROR') { return new AppError(msg, 500, code) }
}
