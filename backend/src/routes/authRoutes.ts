import { Router, Response } from 'express';
import { register, login } from '../services/authService';
import { RegisterRequest, LoginRequest } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRegistration, validateLogin } from '../utils/validation';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validateRegistration,
  asyncHandler(async (req, res: Response): Promise<void> => {
    const data: RegisterRequest = req.body;
    const result = await register(data);
    res.status(201).json(result);
  })
);

/**
 * POST /api/auth/login
 * Login a user
 */
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req, res: Response): Promise<void> => {
    const data: LoginRequest = req.body;
    const result = await login(data);
    res.status(200).json(result);
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'User not authenticated'
      }
    });
    return;
  }

  res.status(200).json({ user: req.user });
});

export default router;
