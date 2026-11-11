import dotenv from 'dotenv';
import app from './app';
import sequelize from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
    try {
        await sequelize.authenticate();

        console.log('Database connected successfully.');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:');

        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }

        process.exit(1);
    }
}

startServer();