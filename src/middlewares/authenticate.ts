import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../errors/AppError';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'owner' | 'customer';
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        next(new AppError('Token autentikasi diperlukan', 401));
        return;
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        next(new AppError('Konfigurasi JWT_SECRET belum tersedia', 500));
        return;
    }

    try {
        const payload = jwt.verify(token, secret);

        if (
            typeof payload === 'string' ||
            typeof payload.id !== 'number' ||
            typeof payload.name !== 'string' ||
            typeof payload.email !== 'string' ||
            !['admin', 'owner', 'customer'].includes(String(payload.role))
        ) {
            next(new AppError('Token tidak valid', 401));
            return;
        }

        req.user = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role as AuthUser['role']
        };

        next();
    } catch {
        next(new AppError('Token tidak valid atau kedaluwarsa', 401));
    }
}