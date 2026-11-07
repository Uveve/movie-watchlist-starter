import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { parseRegister, parseLogin } from '../validators/auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(parseRegister), register);
authRouter.post('/login', validate(parseLogin), login);
