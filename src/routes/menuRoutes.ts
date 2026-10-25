import { Router } from 'express';
import { MenuItem, Stall } from '../models';
import { authenticate } from '../middlewares/authenticate';
import AppError from '../errors/AppError';

const router = Router();

function positiveId(value: unknown, label = 'ID') {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new AppError(`${label} tidak valid`, 400);
    return id;
}

function validateMenuInput(body: any, partial = false) {
    if (!partial || body.name !== undefined) {
        if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 150) {
            throw new AppError('Nama menu wajib diisi dan maksimal 150 karakter', 400);
        }
    }
    if (!partial || body.price !== undefined) {
        const price = Number(body.price);
        if (body.price === '' || body.price === null || !Number.isFinite(price) || price < 0) {
            throw new AppError('Harga harus berupa angka nol atau lebih', 400);
        }
    }
    if (body.is_available !== undefined && typeof body.is_available !== 'boolean') {
        throw new AppError('is_available harus berupa boolean', 400);
    }
}

async function ensureStallAccess(stall: Stall, userId: number, role: string) {
    if (role === 'admin' || Number(stall.owner_id) === userId) return;
    throw new AppError('Tidak memiliki izin untuk mengubah menu kantin ini', 403);
}

async function getMenuAndCheckAccess(menuId: number, userId: number, role: string) {
    const menu = await MenuItem.findByPk(menuId);
    if (!menu) throw new AppError('Menu tidak ditemukan', 404);
    const stall = await Stall.findByPk(Number(menu.stall_id));
    if (!stall) throw new AppError('Kantin terkait tidak ditemukan', 404);
    await ensureStallAccess(stall, userId, role);
    return menu;
}

// GET /api/stalls/:stallId/menu — JOIN stall agar data relasi ikut dikembalikan.
router.get('/stalls/:stallId/menu', async (req, res, next) => {
    try {
        const stallId = positiveId(req.params.stallId, 'ID kantin');
        const stall = await Stall.findByPk(stallId);
        if (!stall) throw new AppError('Kantin tidak ditemukan', 404);

        const menus = await MenuItem.findAll({
            where: { stall_id: stallId },
            include: [{ model: Stall, as: 'stall', attributes: ['id', 'name', 'category', 'location'] }],
            order: [['id', 'ASC']],
        });
        res.status(200).json({ success: true, data: menus });
    } catch (error) {
        next(error);
    }
});

// POST /api/stalls/:stallId/menu
router.post('/stalls/:stallId/menu', authenticate, async (req, res, next) => {
    try {
        const stallId = positiveId(req.params.stallId, 'ID kantin');
        const stall = await Stall.findByPk(stallId);
        if (!stall) throw new AppError('Kantin tidak ditemukan', 404);
        await ensureStallAccess(stall, req.user!.id, req.user!.role);

        validateMenuInput(req.body ?? {});
        const menu = await MenuItem.create({
            stall_id: stallId,
            name: req.body.name.trim(),
            price: Number(req.body.price),
            is_available: req.body.is_available ?? true,
        });

        res.status(201).json({ success: true, message: 'Menu berhasil dibuat', data: menu });
    } catch (error) {
        next(error);
    }
});

// PUT /api/menu/:id
router.put('/menu/:id', authenticate, async (req, res, next) => {
    try {
        const menuId = positiveId(req.params.id, 'ID menu');
        const menu = await getMenuAndCheckAccess(menuId, req.user!.id, req.user!.role);
        validateMenuInput(req.body ?? {}, true);

        if (req.body.name !== undefined) menu.name = req.body.name.trim();
        if (req.body.price !== undefined) menu.price = Number(req.body.price);
        if (req.body.is_available !== undefined) menu.is_available = req.body.is_available;

        await menu.save();
        res.status(200).json({ success: true, message: 'Menu berhasil diperbarui', data: menu });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/menu/:id
router.delete('/menu/:id', authenticate, async (req, res, next) => {
    try {
        const menuId = positiveId(req.params.id, 'ID menu');
        const menu = await getMenuAndCheckAccess(menuId, req.user!.id, req.user!.role);
        await menu.destroy();
        res.status(200).json({ success: true, message: 'Menu berhasil dihapus' });
    } catch (error) {
        next(error);
    }
});

export default router;
