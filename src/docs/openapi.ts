import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { registerSchema, loginSchema } from '../schemas/authSchema';
import {
    idParamSchema,
    stallQuerySchema,
    createStallSchema,
    updateStallSchema,
} from '../schemas/stallSchema';
import { createReviewSchema } from '../schemas/reviewSchema';

const registry = new OpenAPIRegistry();

// ==================================================
// KOMPONEN GLOBAL
// ==================================================

// Skema autentikasi JWT.
// Gunakan tombol Authorize di Swagger untuk memasukkan token.
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Masukkan JWT access token. Swagger akan menambahkan prefix Bearer secara otomatis.',
});

// Parameter ID numerik untuk endpoint kantin.
const stallIdParamSchema = z.object({
    stallId: z.string().regex(/^[1-9]\d*$/, 'ID kantin harus berupa bilangan bulat positif'),
});

// Parameter ID numerik untuk endpoint lainnya.
const genericIdParamSchema = z.object({
    id: z.string().regex(/^[1-9]\d*$/, 'ID harus berupa bilangan bulat positif'),
});

// Skema respons error yang digunakan sebagai dokumentasi umum.
const errorResponseSchema = z.object({
    status: z.enum(['fail', 'error']),
    message: z.string(),
    errors: z.array(
        z.object({
            field: z.string(),
            message: z.string(),
        }),
    ).optional(),
});

// Skema respons sukses umum.
// CATATAN: Bentuk data sebenarnya mengikuti respons masing-masing endpoint.
const successResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
});

// Skema respons daftar kantin dengan pagination.
const stallListResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(z.any()),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

// Skema respons login dan registrasi.
const authResponseSchema = z.object({
    status: z.string(),
    message: z.string().optional(),
    data: z.object({
        user: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
            role: z.enum(['admin', 'owner', 'customer']),
            created_at: z.any().optional(),
        }),
        token: z.string().optional(),
    }),
});

// Skema body pembuatan pengguna oleh admin.
const createUserSchema = z.object({
    name: z.string().min(3).max(100),
    email: z.string().email().max(150),
    password: z.string().min(8).max(72),
    role: z.enum(['admin', 'owner', 'customer']).optional(),
});

// Skema body pembuatan menu.
const createMenuSchema = z.object({
    name: z.string().min(1).max(150),
    price: z.number().min(0),
    is_available: z.boolean().optional(),
});

// Skema body pembaruan menu.
// Semua field bersifat opsional karena pembaruan dilakukan secara parsial.
const updateMenuSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    price: z.number().min(0).optional(),
    is_available: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Minimal satu field harus diisi' },
);

// Skema body perubahan status laporan.
const updateFlagSchema = z.object({
    status: z.enum(['pending', 'resolved', 'dismissed']),
});

// Skema body pembuatan audit log.
// user_id tidak disediakan karena diambil dari token pengguna yang login.
const createAuditLogSchema = z.object({
    action: z.string().min(1).max(100),
    target_table: z.string().min(1).max(100),
    target_id: z.number().int().positive().nullable().optional(),
    metadata: z.any().optional(),
});

// ==================================================
// AUTHENTICATION
// ==================================================

// POST /api/auth/register
registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    tags: ['Authentication'],
    summary: 'Registrasi pengguna',
    description: 'Mendaftarkan pengguna baru. Role awal ditentukan oleh implementasi registrasi.',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: registerSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Registrasi berhasil',
            content: {
                'application/json': {
                    schema: authResponseSchema,
                },
            },
        },
        400: { description: 'Validasi input gagal' },
        409: { description: 'Email sudah terdaftar, jika konflik ditangani oleh controller' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/auth/login
registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    tags: ['Authentication'],
    summary: 'Login pengguna',
    description: 'Memverifikasi kredensial dan mengembalikan token JWT.',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: loginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Login berhasil',
            content: {
                'application/json': {
                    schema: authResponseSchema,
                },
            },
        },
        400: { description: 'Validasi input gagal' },
        401: { description: 'Kredensial tidak valid' },
        500: { description: 'Kesalahan internal server' },
    },
});

// GET /api/auth/me
registry.registerPath({
    method: 'get',
    path: '/api/auth/me',
    tags: ['Authentication'],
    summary: 'Melihat profil pengguna yang login',
    description: 'Mengambil informasi pengguna berdasarkan JWT yang dikirim.',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Profil pengguna berhasil diperoleh',
            content: {
                'application/json': {
                    schema: successResponseSchema,
                },
            },
        },
        401: { description: 'Token tidak tersedia, tidak valid, atau kedaluwarsa' },
    },
});

// ==================================================
// USERS
// Base path pada app.ts: /api/users
// ==================================================

// GET /api/users
registry.registerPath({
    method: 'get',
    path: '/api/users',
    tags: ['Users'],
    summary: 'Melihat daftar pengguna',
    description: 'Hanya admin yang dapat melihat daftar pengguna.',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: 'Daftar pengguna berhasil diperoleh',
            content: {
                'application/json': {
                    schema: successResponseSchema,
                },
            },
        },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/users
registry.registerPath({
    method: 'post',
    path: '/api/users',
    tags: ['Users'],
    summary: 'Membuat akun pengguna',
    description: 'Hanya admin yang dapat membuat akun melalui endpoint ini. Pendaftaran publik menggunakan /api/auth/register.',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createUserSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Pengguna berhasil dibuat' },
        400: { description: 'Data pengguna tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        409: { description: 'Email sudah terdaftar' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// STALLS
// Base path pada app.ts: /api/stalls
// ==================================================

// GET /api/stalls
// TAMBAHAN: Tetap publik karena route tidak menggunakan authenticate.
registry.registerPath({
    method: 'get',
    path: '/api/stalls',
    tags: ['Stalls'],
    summary: 'Melihat daftar kantin',
    description: 'Endpoint publik dengan pencarian, filter kategori, dan pagination.',
    request: {
        query: stallQuerySchema,
    },
    responses: {
        200: {
            description: 'Daftar kantin berhasil diperoleh',
            content: {
                'application/json': {
                    schema: stallListResponseSchema,
                },
            },
        },
        400: { description: 'Parameter query tidak valid' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/stalls
registry.registerPath({
    method: 'post',
    path: '/api/stalls',
    tags: ['Stalls'],
    summary: 'Membuat kantin baru',
    description: 'Hanya owner atau admin. owner_id diambil dari JWT, bukan dari body.',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createStallSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Kantin berhasil dibuat' },
        400: { description: 'Validasi input gagal' },
        401: { description: 'Token diperlukan, tidak valid, atau pengguna tidak ditemukan' },
        403: { description: 'Role pengguna tidak memiliki izin' },
        500: { description: 'Kesalahan internal server' },
    },
});

// GET /api/stalls/{id}
registry.registerPath({
    method: 'get',
    path: '/api/stalls/{id}',
    tags: ['Stalls'],
    summary: 'Melihat detail kantin',
    description: 'Endpoint publik yang menampilkan detail kantin, pemilik, menu, dan ulasan.',
    request: {
        params: idParamSchema,
    },
    responses: {
        200: {
            description: 'Detail kantin berhasil diperoleh',
            content: {
                'application/json': {
                    schema: successResponseSchema,
                },
            },
        },
        400: { description: 'ID kantin tidak valid' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// PUT /api/stalls/{id}
registry.registerPath({
    method: 'put',
    path: '/api/stalls/{id}',
    tags: ['Stalls'],
    summary: 'Memperbarui data kantin',
    description: 'Owner hanya dapat memperbarui kantin miliknya. Admin dapat memperbarui kantin mana pun. owner_id tidak dapat diubah melalui body.',
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: updateStallSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Data kantin berhasil diperbarui' },
        400: { description: 'ID atau body tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna bukan pemilik kantin dan bukan admin' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// DELETE /api/stalls/{id}
registry.registerPath({
    method: 'delete',
    path: '/api/stalls/{id}',
    tags: ['Stalls'],
    summary: 'Menghapus kantin',
    description: 'Hanya admin yang diizinkan menghapus kantin.',
    security: [{ bearerAuth: [] }],
    request: {
        params: idParamSchema,
    },
    responses: {
        200: { description: 'Kantin berhasil dihapus' },
        400: { description: 'ID kantin tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// MENUS
// Route berasal dari menuRoutes.ts yang dipasang pada /api
// ==================================================

// GET /api/stalls/{stallId}/menu
registry.registerPath({
    method: 'get',
    path: '/api/stalls/{stallId}/menu',
    tags: ['Menus'],
    summary: 'Melihat menu kantin',
    description: 'Endpoint publik untuk melihat daftar menu pada kantin tertentu.',
    request: {
        params: stallIdParamSchema,
    },
    responses: {
        200: { description: 'Daftar menu berhasil diperoleh' },
        400: { description: 'ID kantin tidak valid' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/stalls/{stallId}/menu
registry.registerPath({
    method: 'post',
    path: '/api/stalls/{stallId}/menu',
    tags: ['Menus'],
    summary: 'Menambahkan menu kantin',
    description: 'Hanya owner kantin terkait atau admin yang dapat menambahkan menu.',
    security: [{ bearerAuth: [] }],
    request: {
        params: stallIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createMenuSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Menu berhasil dibuat' },
        400: { description: 'ID kantin atau data menu tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna tidak memiliki akses ke kantin tersebut' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// PUT /api/menu/{id}
registry.registerPath({
    method: 'put',
    path: '/api/menu/{id}',
    tags: ['Menus'],
    summary: 'Memperbarui menu',
    description: 'Hanya owner kantin terkait atau admin yang dapat memperbarui menu.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: updateMenuSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Menu berhasil diperbarui' },
        400: { description: 'ID atau data menu tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna tidak memiliki akses ke kantin tersebut' },
        404: { description: 'Menu atau kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// DELETE /api/menu/{id}
registry.registerPath({
    method: 'delete',
    path: '/api/menu/{id}',
    tags: ['Menus'],
    summary: 'Menghapus menu',
    description: 'Hanya owner kantin terkait atau admin yang dapat menghapus menu.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
    },
    responses: {
        200: { description: 'Menu berhasil dihapus' },
        400: { description: 'ID menu tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna tidak memiliki akses ke kantin tersebut' },
        404: { description: 'Menu atau kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// REVIEWS
// Route berasal dari reviewRoutes.ts yang dipasang pada /api
// ==================================================

// GET /api/stalls/{stallId}/reviews
registry.registerPath({
    method: 'get',
    path: '/api/stalls/{stallId}/reviews',
    tags: ['Reviews'],
    summary: 'Melihat ulasan suatu kantin',
    description: 'Endpoint publik untuk melihat ulasan beserta informasi pengguna yang menulisnya.',
    request: {
        params: stallIdParamSchema,
    },
    responses: {
        200: { description: 'Daftar ulasan berhasil diperoleh' },
        400: { description: 'ID kantin tidak valid' },
        404: { description: 'Kantin tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/stalls/{stallId}/reviews
registry.registerPath({
    method: 'post',
    path: '/api/stalls/{stallId}/reviews',
    tags: ['Reviews'],
    summary: 'Memberikan ulasan pada kantin',
    description: 'Pengguna harus login. Rating berupa bilangan bulat 1–5; satu pengguna tidak dapat mengulas kantin yang sama lebih dari sekali.',
    security: [{ bearerAuth: [] }],
    request: {
        params: stallIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createReviewSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Ulasan berhasil dibuat' },
        400: { description: 'ID kantin atau isi ulasan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        404: { description: 'Kantin tidak ditemukan' },
        409: { description: 'Pengguna sudah memberikan ulasan pada kantin tersebut' },
        500: { description: 'Kesalahan internal server' },
    },
});

// PUT /api/reviews/{id}
registry.registerPath({
    method: 'put',
    path: '/api/reviews/{id}',
    tags: ['Reviews'],
    summary: 'Memperbarui ulasan',
    description: 'Hanya pemilik ulasan atau admin yang dapat memperbarui ulasan. Body bersifat parsial.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        rating: z.number().int().min(1).max(5).optional(),
                        comment: z.string().max(1000).nullable().optional(),
                    }).refine(
                        (data) => Object.keys(data).length > 0,
                        { message: 'Minimal satu field harus diisi' },
                    ),
                },
            },
        },
    },
    responses: {
        200: { description: 'Ulasan berhasil diperbarui' },
        400: { description: 'ID atau isi ulasan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna bukan pemilik ulasan dan bukan admin' },
        404: { description: 'Ulasan tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// DELETE /api/reviews/{id}
registry.registerPath({
    method: 'delete',
    path: '/api/reviews/{id}',
    tags: ['Reviews'],
    summary: 'Menghapus ulasan',
    description: 'Hanya pemilik ulasan atau admin yang dapat menghapus ulasan.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
    },
    responses: {
        200: { description: 'Ulasan berhasil dihapus' },
        400: { description: 'ID ulasan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Pengguna bukan pemilik ulasan dan bukan admin' },
        404: { description: 'Ulasan tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/reviews/{id}/like
registry.registerPath({
    method: 'post',
    path: '/api/reviews/{id}/like',
    tags: ['Reviews'],
    summary: 'Memberikan like pada ulasan',
    description: 'Pengguna harus login. Like ganda oleh pengguna yang sama ditolak.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
    },
    responses: {
        201: { description: 'Like berhasil diberikan' },
        400: { description: 'ID ulasan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        404: { description: 'Ulasan tidak ditemukan' },
        409: { description: 'Pengguna sudah memberikan like' },
        500: { description: 'Kesalahan internal server' },
    },
});

// DELETE /api/reviews/{id}/like
registry.registerPath({
    method: 'delete',
    path: '/api/reviews/{id}/like',
    tags: ['Reviews'],
    summary: 'Menghapus like dari ulasan',
    description: 'Menghapus like milik pengguna yang sedang login.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
    },
    responses: {
        200: { description: 'Like berhasil dihapus' },
        400: { description: 'ID ulasan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        404: { description: 'Ulasan atau like milik pengguna tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/reviews/{id}/flag
registry.registerPath({
    method: 'post',
    path: '/api/reviews/{id}/flag',
    tags: ['Reviews'],
    summary: 'Melaporkan ulasan',
    description: 'Pengguna yang login dapat mengirim laporan dengan alasan maksimal 500 karakter.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: z.object({
                        reason: z.string().trim().min(1).max(500),
                    }),
                },
            },
        },
    },
    responses: {
        201: { description: 'Laporan berhasil dibuat' },
        400: { description: 'ID ulasan atau alasan laporan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        404: { description: 'Ulasan tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// FLAGS
// Base path pada app.ts: /api/flags
// ==================================================

// GET /api/flags
registry.registerPath({
    method: 'get',
    path: '/api/flags',
    tags: ['Flags'],
    summary: 'Melihat daftar laporan ulasan',
    description: 'Hanya admin yang dapat melihat daftar laporan, termasuk ringkasan ulasan dan pelapor.',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Daftar laporan berhasil diperoleh' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// PUT /api/flags/{id}
registry.registerPath({
    method: 'put',
    path: '/api/flags/{id}',
    tags: ['Flags'],
    summary: 'Memperbarui status laporan',
    description: 'Hanya admin yang dapat mengubah status laporan menjadi pending, resolved, atau dismissed.',
    security: [{ bearerAuth: [] }],
    request: {
        params: genericIdParamSchema,
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: updateFlagSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Status laporan berhasil diperbarui' },
        400: { description: 'ID atau status laporan tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        404: { description: 'Laporan tidak ditemukan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// AUDIT LOGS
// Base path pada app.ts: /api/audit-logs
// ==================================================

// GET /api/audit-logs
registry.registerPath({
    method: 'get',
    path: '/api/audit-logs',
    tags: ['Audit Logs'],
    summary: 'Melihat daftar audit log',
    description: 'Hanya admin yang dapat melihat catatan aktivitas sistem.',
    security: [{ bearerAuth: [] }],
    responses: {
        200: { description: 'Daftar audit log berhasil diperoleh' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// POST /api/audit-logs
registry.registerPath({
    method: 'post',
    path: '/api/audit-logs',
    tags: ['Audit Logs'],
    summary: 'Membuat audit log',
    description: 'Hanya admin. user_id diambil dari pengguna yang sedang login; metadata dapat dikirim sebagai teks atau objek JSON.',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createAuditLogSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Audit log berhasil dibuat' },
        400: { description: 'Data audit log tidak valid' },
        401: { description: 'Token autentikasi diperlukan atau tidak valid' },
        403: { description: 'Hanya admin yang diizinkan' },
        500: { description: 'Kesalahan internal server' },
    },
});

// ==================================================
// GENERATE OPENAPI DOCUMENT
// ==================================================

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'Review Kantin API',
        version: '1.0.0',
        description:
            'Dokumentasi REST API Review Kantin. Gunakan JWT Bearer Token untuk endpoint yang memerlukan autentikasi. Hak akses tetap ditentukan oleh middleware pada server.',
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Server lokal',
        },
    ],
});

export default openApiDocument;
