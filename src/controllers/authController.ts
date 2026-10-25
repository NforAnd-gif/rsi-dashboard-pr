import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import AppError from '../errors/AppError';
import type { RegisterInput, LoginInput } from '../schemas/authSchema';

function createToken(user: User): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError('Konfigurasi JWT_SECRET belum tersedia', 500);
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'];

    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        secret,
        { expiresIn }
    );
}

function publicUser(user: User) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
    };
}

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, email, password } = req.body as RegisterInput;

        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            next(new AppError('Email sudah terdaftar', 409));
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Registrasi publik selalu menjadi customer.
        // Role admin/owner tidak boleh ditentukan dari request body.
        const user = await User.create({
            name,
            email,
            password_hash: passwordHash,
            role: 'customer'
        });

        const token = createToken(user);

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil',
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { email, password } = req.body as LoginInput;

        const user = await User.findOne({
            where: { email }
        });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            next(new AppError('Email atau password salah', 401));
            return;
        }

        const token = createToken(user);

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil',
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function me(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user) {
            next(new AppError('Autentikasi diperlukan', 401));
            return;
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            next(new AppError('Pengguna tidak ditemukan', 401));
            return;
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: publicUser(user)
            }
        });
    } catch (error) {
        next(error);
    }
}