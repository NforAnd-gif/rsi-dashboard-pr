import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import AppError from '../errors/AppError';

const router = Router();

function publicUser(user: User) {
    const result = user.toJSON() as Record<string, unknown>;
    delete result.password_hash;
    return result;
}

// GET /api/users — daftar pengguna hanya untuk admin.
router.get('/', authenticate, authorize('admin'), async (_req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'created_at'],
            order: [['id', 'ASC']],
        });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

// POST /api/users — administrasi akun; gunakan "password", bukan password_hash.
// Pendaftaran publik tetap menggunakan POST /api/auth/register.
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body ?? {};

        if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
            throw new AppError('Nama wajib diisi (3–100 karakter)', 400);
        }
        if (typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            email.trim().length > 150) {
            throw new AppError('Email tidak valid', 400);
        }
        if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
            throw new AppError('Password harus terdiri dari 8–72 karakter', 400);
        }
        const allowedRoles = ['admin', 'owner', 'customer'];
        if (role !== undefined && !allowedRoles.includes(role)) {
            throw new AppError('Role harus admin, owner, atau customer', 400);
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ where: { email: normalizedEmail } });
        if (existing) throw new AppError('Email sudah terdaftar', 409);

        const password_hash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password_hash,
            role: role ?? 'customer',
            created_at: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'Pengguna berhasil dibuat',
            data: publicUser(user),
        });
    } catch (error) {
        next(error);
    }
});

export default router;
