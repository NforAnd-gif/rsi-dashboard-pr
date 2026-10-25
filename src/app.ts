import express from 'express';
import swaggerUi from 'swagger-ui-express';

import userRoutes from './routes/userRoutes';
import stallRoutes from './routes/stallRoutes';
import reviewRoutes from './routes/reviewRoutes';
import menuRoutes from './routes/menuRoutes';
import flagRoutes from './routes/flagRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import authRoutes from './routes/authRoutes';

import errorHandler from './errors/errorHandler';
import openApiDocument from './docs/openapi';

const app = express();

app.use(express.json());

// Root
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Review Kantin API is running',
        documentation: '/docs',
    });
});

// Swagger UI dan dokumen OpenAPI JSON
app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api', reviewRoutes);
app.use('/api', menuRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/auth', authRoutes);

// 404 — cukup satu kali, setelah seluruh route
app.use((_req, res) => {
    res.status(404).json({
        status: 'fail',
        message: 'Endpoint tidak ditemukan',
    });
});

// Global error handler — harus paling akhir
app.use(errorHandler);

export default app;