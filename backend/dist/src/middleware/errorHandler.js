"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    message;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Validation Error',
            details: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            details: err.details,
        });
        return;
    }
    console.error('[Unhandled Error]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
}
//# sourceMappingURL=errorHandler.js.map