import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  authenticateUser,
  getPasswordPolicyMessage,
  registerResearcher,
  serializeUser,
} from '../services/userService.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const session = await authenticateUser(req.body);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const session = await registerResearcher(req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

authRouter.get('/password-policy', (_req, res) => {
  res.json({ message: getPasswordPolicyMessage() });
});
