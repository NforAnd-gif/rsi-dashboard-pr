import type { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import type { AuthUser } from './authenticate';

type UserRole = AuthUser['role'];

export function authorize(...allowedRoles: UserRole[]) {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            next(new AppError('Autentikasi diperlukan', 401));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(
                new AppError(
                    'Anda tidak memiliki izin untuk mengakses resource ini',
                    403
                )
            );
            return;
        }

        next();
    };
}