
import { z } from 'zod';

export const createReviewSchema = z.object({
    rating: z.number()
        .int('rating harus berupa bilangan bulat')
        .min(1, 'rating minimal 1')
        .max(5, 'rating maksimal 5'),

    comment: z.string()
        .trim()
        .max(1000, 'comment maksimal 1000 karakter')
        .optional()
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
