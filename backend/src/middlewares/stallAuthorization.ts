import type { Request, Response, NextFunction } from 'express';
import Stall from '../models/Stall';
import AppError from '../errors/AppError';

export async function authorizeStallOwnerOrAdmin(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            next(new AppError('Autentikasi diperlukan', 401));
            return;
        }

        // Admin boleh mengubah stall milik siapa pun.
        if (req.user.role === 'admin') {
            next();
            return;
        }

        // Selain admin, hanya owner yang dapat melanjutkan.
        if (req.user.role !== 'owner') {
            next(new AppError('Hanya owner atau admin yang diizinkan', 403));
            return;
        }

        const stallId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!stallId) {
            next(new AppError('ID stall tidak valid', 400));
            return;
        }

        const stall = await Stall.findByPk(stallId);

        if (!stall) {
            next(new AppError('Stall tidak ditemukan', 404));
            return;
        }

        if (Number(stall.owner_id) !== req.user.id) {
            next(new AppError('Anda bukan pemilik stall ini', 403));
            return;
        }

        next();
    } catch (error) {
        next(error);
    }
}