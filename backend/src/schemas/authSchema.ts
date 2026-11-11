
import { z } from 'zod';

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'name minimal 3 karakter')
        .max(100, 'name maksimal 100 karakter'),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('format email tidak valid')
        .max(150, 'email maksimal 150 karakter'),

    password: z
        .string()
        .min(8, 'password minimal 8 karakter')
        .max(72, 'password maksimal 72 karakter')
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('format email tidak valid')
        .max(150, 'email maksimal 150 karakter'),

    password: z
        .string()
        .min(1, 'password wajib diisi')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
