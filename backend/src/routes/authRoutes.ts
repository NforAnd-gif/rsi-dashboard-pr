import { Router } from 'express';
import { register, login, me } from '../controllers/authController';
import { registerSchema, loginSchema } from '../schemas/authSchema';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), register);
router.post('/login', validate(loginSchema, 'body'), login);
router.get('/me', authenticate, me);

export default router;