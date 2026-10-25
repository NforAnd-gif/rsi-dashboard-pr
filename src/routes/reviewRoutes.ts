import { Router } from 'express';
import { Review, Stall, User, Like, Flag } from '../models';
import { authenticate } from '../middlewares/authenticate';
import AppError from '../errors/AppError';
import { writeAuditLog } from '../utils/auditLog';

const router = Router();

function positiveId(value: unknown, label = 'ID') {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`${label} tidak valid`, 400);
    }
    return id;
}

async function updateStallRating(stallId: number) {
    const reviews = await Review.findAll({
        where: { stall_id: stallId },
        attributes: ['rating'],
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount
        ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewCount
        : 0;

    await Stall.update(
        {
            avg_rating: Number(averageRating.toFixed(2)),
            review_count: reviewCount,
        },
        { where: { id: stallId } },
    );
}

async function ensureReviewOwnerOrAdmin(review: Review, userId: number, role: string) {
    if (role === 'admin' || Number(review.user_id) === userId) return;
    throw new AppError('Tidak memiliki izin untuk mengubah review ini', 403);
}

// GET /api/stalls/:stallId/reviews — publik, JOIN pengguna tanpa password_hash.
router.get('/stalls/:stallId/reviews', async (req, res, next) => {
    try {
        const stallId = positiveId(req.params.stallId, 'ID kantin');
        const stall = await Stall.findByPk(stallId);
        if (!stall) throw new AppError('Kantin tidak ditemukan', 404);

        const reviews = await Review.findAll({
            where: { stall_id: stallId },
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
});

// POST /api/stalls/:stallId/reviews — identitas user diambil dari JWT.
router.post('/stalls/:stallId/reviews', authenticate, async (req, res, next) => {
    try {
        const stallId = positiveId(req.params.stallId, 'ID kantin');
        const userId = req.user!.id;
        const rating = Number(req.body?.rating);
        const comment = req.body?.comment;

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new AppError('Rating harus berupa bilangan bulat 1 sampai 5', 400);
        }
        if (comment !== undefined && comment !== null &&
            (typeof comment !== 'string' || comment.trim().length > 1000)) {
            throw new AppError('Komentar harus berupa teks maksimal 1000 karakter', 400);
        }

        const stall = await Stall.findByPk(stallId);
        if (!stall) throw new AppError('Kantin tidak ditemukan', 404);

        const existingReview = await Review.findOne({
            where: { stall_id: stallId, user_id: userId },
        });
        if (existingReview) {
            throw new AppError('Kamu sudah memberikan review untuk kantin ini', 409);
        }

        const review = await Review.create({
            stall_id: stallId,
            user_id: userId,
            rating,
            comment: typeof comment === 'string' && comment.trim() ? comment.trim() : null,
            like_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await updateStallRating(stallId);
        await writeAuditLog({
            user_id: userId,
            action: 'CREATE_REVIEW',
            target_table: 'REVIEWS',
            target_id: review.id,
            metadata: { stall_id: stallId, rating },
        });

        res.status(201).json({
            success: true,
            message: 'Review berhasil dibuat',
            data: review,
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/reviews/:id — endpoint tambahan; hanya pemilik review atau admin.
router.put('/reviews/:id', authenticate, async (req, res, next) => {
    try {
        const id = positiveId(req.params.id, 'ID review');
        const review = await Review.findByPk(id);
        if (!review) throw new AppError('Review tidak ditemukan', 404);

        await ensureReviewOwnerOrAdmin(review, req.user!.id, req.user!.role);

        const { rating, comment } = req.body ?? {};
        if (rating !== undefined) {
            const parsedRating = Number(rating);
            if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                throw new AppError('Rating harus berupa bilangan bulat 1 sampai 5', 400);
            }
            review.rating = parsedRating;
        }
        if (comment !== undefined) {
            if (comment !== null && (typeof comment !== 'string' || comment.trim().length > 1000)) {
                throw new AppError('Komentar maksimal 1000 karakter', 400);
            }
            review.comment = typeof comment === 'string' && comment.trim() ? comment.trim() : null;
        }
        review.updated_at = new Date();
        await review.save();
        await updateStallRating(Number(review.stall_id));

        res.status(200).json({ success: true, message: 'Review berhasil diperbarui', data: review });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/reviews/:id — wajib tugas; hanya pemilik review atau admin.
router.delete('/reviews/:id', authenticate, async (req, res, next) => {
    try {
        const id = positiveId(req.params.id, 'ID review');
        const review = await Review.findByPk(id);
        if (!review) throw new AppError('Review tidak ditemukan', 404);

        await ensureReviewOwnerOrAdmin(review, req.user!.id, req.user!.role);
        const stallId = Number(review.stall_id);

        await Like.destroy({ where: { review_id: id } });
        await Flag.destroy({ where: { review_id: id } });
        await review.destroy();
        await updateStallRating(stallId);

        await writeAuditLog({
            user_id: req.user!.id,
            action: 'DELETE_REVIEW',
            target_table: 'REVIEWS',
            target_id: id,
            metadata: { stall_id: stallId },
        });

        res.status(200).json({ success: true, message: 'Review berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

// POST /api/reviews/:id/like — satu like per user per review.
router.post('/reviews/:id/like', authenticate, async (req, res, next) => {
    try {
        const reviewId = positiveId(req.params.id, 'ID review');
        const userId = req.user!.id;
        const review = await Review.findByPk(reviewId);
        if (!review) throw new AppError('Review tidak ditemukan', 404);

        const existingLike = await Like.findOne({
            where: { review_id: reviewId, user_id: userId },
        });
        if (existingLike) throw new AppError('Kamu sudah menyukai review ini', 409);

        await Like.create({
            review_id: reviewId,
            user_id: userId,
            created_at: new Date(),
        });
        await Review.increment('like_count', { by: 1, where: { id: reviewId } });

        res.status(201).json({ success: true, message: 'Like berhasil ditambahkan' });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/reviews/:id/like — user hanya dapat menghapus like miliknya sendiri.
router.delete('/reviews/:id/like', authenticate, async (req, res, next) => {
    try {
        const reviewId = positiveId(req.params.id, 'ID review');
        const userId = req.user!.id;
        const review = await Review.findByPk(reviewId);
        if (!review) throw new AppError('Review tidak ditemukan', 404);

        const like = await Like.findOne({ where: { review_id: reviewId, user_id: userId } });
        if (!like) throw new AppError('Like milik pengguna tidak ditemukan', 404);

        await like.destroy();
        await Review.decrement('like_count', {
            by: 1,
            where: { id: reviewId },
        });
        res.status(200).json({ success: true, message: 'Like berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

// POST /api/reviews/:id/flag — identitas pelapor diambil dari JWT.
router.post('/reviews/:id/flag', authenticate, async (req, res, next) => {
    try {
        const reviewId = positiveId(req.params.id, 'ID review');
        const userId = req.user!.id;
        const reason = req.body?.reason;

        if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) {
            throw new AppError('Alasan laporan wajib diisi (maksimal 500 karakter)', 400);
        }

        const review = await Review.findByPk(reviewId);
        if (!review) throw new AppError('Review tidak ditemukan', 404);

        const flag = await Flag.create({
            review_id: reviewId,
            reported_by: userId,
            reason: reason.trim(),
            status: 'pending',
            created_at: new Date(),
        });

        await writeAuditLog({
            user_id: userId,
            action: 'CREATE_FLAG',
            target_table: 'FLAGS',
            target_id: flag.id,
            metadata: { review_id: reviewId },
        });

        res.status(201).json({ success: true, message: 'Laporan berhasil dikirim', data: flag });
    } catch (error) {
        next(error);
    }
});

export default router;
