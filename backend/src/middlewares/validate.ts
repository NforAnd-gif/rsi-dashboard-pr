
import type {
    Request,
    RequestHandler
} from 'express';

import type { z } from 'zod';
import AppError from '../errors/AppError';

type RequestSource = 'body' | 'params' | 'query';

interface ValidationIssue {
    field: string;
    message: string;
}

export function validate(
    schema: z.ZodType,
    source: RequestSource
): RequestHandler {
    return (req, _res, next) => {
        const request = req as Request & {
            [key: string]: unknown;
        };

        const result = schema.safeParse(request[source]);

        if (!result.success) {
            const errors: ValidationIssue[] =
                result.error.issues.map((issue) => ({
                    field: issue.path.map(String).join('.'),
                    message: issue.message
                }));

            const error = new AppError(
                'Validasi gagal',
                400
            ) as AppError & {
                errors?: ValidationIssue[];
            };

            error.errors = errors;

            next(error);
            return;
        }

    Object.defineProperty(request, source, {
        value: result.data,
        writable: true,
        configurable: true,
     enumerable: true
    });
        next();
    };
}
