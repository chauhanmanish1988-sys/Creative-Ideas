import { Router, Request, Response } from 'express';
import { getUserIdeas } from '../services/ideaService';
import { getUserProfile, updateUser } from '../services/userService';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { UpdateUserRequest } from '../models/User';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateUUIDParam } from '../utils/validation';

const router = Router();

/**
 * GET /api/users/:id
 * Get user profile with statistics
 */
router.get(
  '/:id',
  validateUUIDParam('id'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const userProfile = getUserProfile(userId);

    if (!userProfile) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.status(200).json(userProfile);
  })
);

/**
 * PUT /api/users/:id
 * Update user profile (authenticated users only, can only update own profile)
 */
router.put(
  '/:id',
  authenticateToken,
  validateUUIDParam('id'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.params.id;
    const authenticatedUserId = req.user?.id;

    // Check if user is updating their own profile
    if (userId !== authenticatedUserId) {
      throw new AppError(403, 'FORBIDDEN_RESOURCE', 'You can only update your own profile');
    }

    const updates: UpdateUserRequest = {
      username: req.body.username,
      email: req.body.email,
    };

    // Remove undefined fields
    if (updates.username === undefined) {
      delete updates.username;
    }
    if (updates.email === undefined) {
      delete updates.email;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      throw new AppError(400, 'VALIDATION_FAILED', 'No valid fields to update');
    }

    const updatedUser = updateUser(userId, updates);
    res.status(200).json(updatedUser);
  })
);

/**
 * GET /api/users/:userId/ideas
 * Get all ideas by a specific user
 */
router.get(
  '/:userId/ideas',
  validateUUIDParam('userId'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const ideas = getUserIdeas(userId);

    res.status(200).json({ ideas });
  })
);

export default router;
