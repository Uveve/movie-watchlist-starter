import { Router } from 'express';
import { loginLimiter, registerLimiter } from '../middleware/rate-limit.js';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { parseRegister, parseLogin } from '../validators/auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(parseRegister), register);
authRouter.post('/login', loginLimiter, validate(parseLogin), login);
