import { Router } from 'express';
import { AuditLog } from '../models';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import AppError from '../errors/AppError';

const router = Router();

// GET /api/audit-logs — log berisi informasi internal, hanya admin.
router.get('/', authenticate, authorize('admin'), async (_req, res, next) => {
    try {
        const logs = await AuditLog.findAll({ order: [['id', 'DESC']] });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        next(error);
    }
});

// POST /api/audit-logs — hanya admin; user_id tidak diambil dari body.
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { action, target_table, target_id, metadata } = req.body ?? {};
        if (typeof action !== 'string' || !action.trim() || action.trim().length > 100) {
            throw new AppError('action wajib diisi dan maksimal 100 karakter', 400);
        }
        if (typeof target_table !== 'string' || !target_table.trim() || target_table.trim().length > 100) {
            throw new AppError('target_table wajib diisi dan maksimal 100 karakter', 400);
        }

        let parsedTargetId: number | null = null;
        if (target_id !== undefined && target_id !== null && target_id !== '') {
            parsedTargetId = Number(target_id);
            if (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0) {
                throw new AppError('target_id harus berupa bilangan bulat positif', 400);
            }
        }

        const metadataText = metadata === undefined || metadata === null
            ? null
            : typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

        if (metadataText !== null && metadataText.length > 1000) {
            throw new AppError('metadata maksimal 1000 karakter', 400);
        }

        const log = await AuditLog.create({
            user_id: req.user!.id,
            action: action.trim(),
            target_table: target_table.trim(),
            target_id: parsedTargetId,
            metadata: metadataText,
            created_at: new Date(),
        });

        res.status(201).json({ success: true, message: 'Audit log berhasil dibuat', data: log });
    } catch (error) {
        next(error);
    }
});

export default router;
