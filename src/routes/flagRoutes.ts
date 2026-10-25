import { Router } from 'express';
import { Flag, Review, User } from '../models';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import AppError from '../errors/AppError';
import { writeAuditLog } from '../utils/auditLog';

const router = Router();
const validStatuses = ['pending', 'resolved', 'dismissed'] as const;

// GET /api/flags — hanya admin karena hasilnya memuat laporan pengguna.
router.get('/', authenticate, authorize('admin'), async (_req, res, next) => {
    try {
        const flags = await Flag.findAll({
            include: [
                {
                    model: Review,
                    as: 'review',
                    attributes: ['id', 'stall_id', 'user_id', 'rating', 'comment'],
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['created_at', 'DESC']],
        });
        res.status(200).json({ success: true, data: flags });
    } catch (error) {
        next(error);
    }
});

// PUT /api/flags/:id — hanya admin yang boleh memutuskan status laporan.
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) throw new AppError('ID flag tidak valid', 400);

        const status = req.body?.status;
        if (typeof status !== 'string' || !validStatuses.includes(status as typeof validStatuses[number])) {
            throw new AppError('Status harus pending, resolved, atau dismissed', 400);
        }

        const flag = await Flag.findByPk(id);
        if (!flag) throw new AppError('Laporan tidak ditemukan', 404);

        const previousStatus = flag.status;
        flag.status = status as typeof validStatuses[number];
        await flag.save();

        await writeAuditLog({
            user_id: req.user!.id,
            action: 'UPDATE_FLAG_STATUS',
            target_table: 'FLAGS',
            target_id: id,
            metadata: { previous_status: previousStatus, status },
        });

        res.status(200).json({ success: true, message: 'Status laporan berhasil diperbarui', data: flag });
    } catch (error) {
        next(error);
    }
});

export default router;
