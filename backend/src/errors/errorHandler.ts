
import type { ErrorRequestHandler } from 'express';
import AppError from './AppError';

const errorHandler: ErrorRequestHandler = (
    err,
    _req,
    res,
    _next
) => {
    if (err instanceof AppError) {
        const validationErrors = (
            err as AppError & {
                errors?: {
                    field: string;
                    message: string;
                }[];
            }
        ).errors;

        res.status(err.statusCode).json({
            status: 'fail',
            message: err.message,
            ...(validationErrors
                ? { errors: validationErrors }
                : {})
        });

        return;
    }

    console.error(err);

    res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan internal server'
    });
};

export default errorHandler;
