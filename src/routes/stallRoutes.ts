
import { Router } from 'express';
import { Op } from 'sequelize';

import {
    Stall,
    User,
    MenuItem,
    Review
} from '../models';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
    authorizeStallOwnerOrAdmin
} from '../middlewares/stallAuthorization';

import { validate } from '../middlewares/validate';
import {
    idParamSchema,
    stallQuerySchema,
    createStallSchema,
    updateStallSchema,
    type StallQuery,
    type CreateStallInput,
    type UpdateStallInput
} from '../schemas/stallSchema';

import AppError from '../errors/AppError';

const router = Router();

/*
==================================================
GET /api/stalls
Daftar kantin
- Search
- Filter category
- Pagination
- Public
==================================================
*/
router.get(
    '/',
    validate(stallQuerySchema, 'query'),
    async (req, res, next) => {
        try {
            const {
                page,
                limit,
                search,
                category
            } = req.query as unknown as StallQuery;

            const offset = (page - 1) * limit;

            const filters: Record<string, unknown>[] = [];

            if (search) {
                filters.push({
                    [Op.or]: [
                        {
                            name: {
                                [Op.like]: `%${search}%`
                            }
                        },
                        {
                            category: {
                                [Op.like]: `%${search}%`
                            }
                        }
                    ]
                });
            }

            if (category) {
                filters.push({
                    category: {
                        [Op.like]: `%${category}%`
                    }
                });
            }

            const where = filters.length
                ? { [Op.and]: filters }
                : undefined;

            const result = await Stall.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: [
                            'id',
                            'name',
                            'email'
                        ]
                    }
                ],
                limit,
                offset,
                order: [['id', 'ASC']]
            });

            res.status(200).json({
                success: true,
                data: result.rows,
                pagination: {
                    page,
                    limit,
                    total: result.count,
                    totalPages: Math.ceil(
                        result.count / limit
                    )
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/*
==================================================
POST /api/stalls
Membuat kantin
- Hanya owner/admin
- owner_id berasal dari JWT
==================================================
*/
router.post(
    '/',
    authenticate,
    authorize('owner', 'admin'),
    validate(createStallSchema, 'body'),
    async (req, res, next) => {
        try {
            const {
                name,
                category,
                location,
                description
            } = req.body as CreateStallInput;

            const ownerId = req.user!.id;

            const owner = await User.findByPk(ownerId);

            if (!owner) {
                throw new AppError(
                    'Pengguna tidak ditemukan',
                    401
                );
            }

            const stall = await Stall.create({
                owner_id: ownerId,
                name,
                category: category ?? null,
                location: location ?? null,
                description: description ?? null,
                avg_rating: 0,
                review_count: 0,
                created_at: new Date()
            });

            res.status(201).json({
                success: true,
                message: 'Kantin berhasil dibuat',
                data: stall
            });
        } catch (error) {
            next(error);
        }
    }
);

/*
==================================================
GET /api/stalls/:id
Detail kantin
- Owner
- Menu
- Reviews
- User review
- Public
==================================================
*/
router.get(
    '/:id',
    validate(idParamSchema, 'params'),
    async (req, res, next) => {
        try {
            const id = Number(req.params.id);

            const stall = await Stall.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: [
                            'id',
                            'name',
                            'email'
                        ]
                    },
                    {
                        model: MenuItem,
                        as: 'menuItems',
                        attributes: [
                            'id',
                            'name',
                            'price',
                            'is_available'
                        ]
                    },
                    {
                        model: Review,
                        as: 'reviews',
                        attributes: [
                            'id',
                            'rating',
                            'comment',
                            'like_count',
                            'created_at',
                            'updated_at'
                        ],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: [
                                    'id',
                                    'name'
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!stall) {
                throw new AppError(
                    'Kantin tidak ditemukan',
                    404
                );
            }

            res.status(200).json({
                success: true,
                data: stall
            });
        } catch (error) {
            next(error);
        }
    }
);

/*
==================================================
PUT /api/stalls/:id
Mengubah data kantin
- Admin boleh mengubah semua kantin
- Owner hanya boleh mengubah kantin sendiri
==================================================
*/
router.put(
    '/:id',
    authenticate,
    validate(idParamSchema, 'params'),
    authorizeStallOwnerOrAdmin,
    validate(updateStallSchema, 'body'),
    async (req, res, next) => {
        try {
            const id = Number(req.params.id);

            const stall = await Stall.findByPk(id);

            if (!stall) {
                throw new AppError(
                    'Kantin tidak ditemukan',
                    404
                );
            }

            const {
                name,
                category,
                location,
                description
            } = req.body as UpdateStallInput;

            // owner_id sengaja tidak bisa diubah melalui body.
            if (name !== undefined) {
                stall.name = name;
            }

            if (category !== undefined) {
                stall.category = category;
            }

            if (location !== undefined) {
                stall.location = location;
            }

            if (description !== undefined) {
                stall.description = description;
            }

            await stall.save();

            res.status(200).json({
                success: true,
                message: 'Data kantin berhasil diperbarui',
                data: stall
            });
        } catch (error) {
            next(error);
        }
    }
);

/*
==================================================
DELETE /api/stalls/:id
Menghapus kantin
- Hanya admin
==================================================
*/
router.delete(
    '/:id',
    authenticate,
    validate(idParamSchema, 'params'),
    authorize('admin'),
    async (req, res, next) => {
        try {
            const id = Number(req.params.id);

            const stall = await Stall.findByPk(id);

            if (!stall) {
                throw new AppError(
                    'Kantin tidak ditemukan',
                    404
                );
            }

            await stall.destroy();

            res.status(200).json({
                success: true,
                message: 'Kantin berhasil dihapus'
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
