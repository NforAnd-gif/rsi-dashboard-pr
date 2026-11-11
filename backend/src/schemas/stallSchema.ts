
import { z } from 'zod';

export const idParamSchema = z.object({
    id: z.coerce
        .number()
        .int('id harus berupa bilangan bulat')
        .positive('id harus lebih dari 0')
});

export const stallQuerySchema = z.object({
    search: z.string()
        .trim()
        .max(100, 'search maksimal 100 karakter')
        .optional(),

    category: z.string()
        .trim()
        .max(50, 'category maksimal 50 karakter')
        .optional(),

    page: z.coerce.number()
        .int('page harus berupa bilangan bulat')
        .min(1, 'page minimal 1')
        .default(1),

    limit: z.coerce.number()
        .int('limit harus berupa bilangan bulat')
        .min(1, 'limit minimal 1')
        .max(100, 'limit maksimal 100')
        .default(10)
});

export const createStallSchema = z.object({
    name: z.string()
        .trim()
        .min(3, 'name minimal 3 karakter')
        .max(100, 'name maksimal 100 karakter'),

    category: z.string()
        .trim()
        .max(50, 'category maksimal 50 karakter')
        .optional(),

    location: z.string()
        .trim()
        .max(100, 'location maksimal 100 karakter')
        .optional(),

    description: z.string()
        .max(1000, 'description maksimal 1000 karakter')
        .optional()
});

export const updateStallSchema = createStallSchema
    .partial();

export type StallQuery = z.infer<typeof stallQuerySchema>;
export type CreateStallInput = z.infer<typeof createStallSchema>;
export type UpdateStallInput = z.infer<typeof updateStallSchema>;
