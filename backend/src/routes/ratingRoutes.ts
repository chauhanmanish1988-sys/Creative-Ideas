import { Router, Response } from 'express';
import {
  createRating,
  updateRating,
  getRatingStats
} from '../services/ratingService';
import { CreateRatingRequest, UpdateRatingRequest } from '../models/Rating';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateRating, validateUUIDParam } from '../utils/validation';

const router = Router();

/**
 * POST /api/ideas/:ideaId/ratings
 * Create a rating for an idea (requires authentication)
 */
router.post(
  '/:ideaId/ratings',
  authenticateToken,
  validateUUIDParam('ideaId'),
  validateRating,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'User not authenticated');
    }

    const ideaId = req.params.ideaId;
    const data: CreateRatingRequest = req.body;
    const rating = createRating(req.user.id, ideaId, data);

    res.status(201).json(rating);
  })
);

/**
 * PUT /api/ideas/:ideaId/ratings
 * Update an existing rating for an idea (requires authentication)
 */
router.put(
  '/:ideaId/ratings',
  authenticateToken,
  validateUUIDParam('ideaId'),
  validateRating,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'User not authenticated');
    }

    const ideaId = req.params.ideaId;
    const data: UpdateRatingRequest = req.body;
    const rating = updateRating(req.user.id, ideaId, data);

    res.status(200).json(rating);
  })
);

/**
 * GET /api/ideas/:ideaId/ratings/average
 * Get average rating and count for an idea
 */
router.get(
  '/:ideaId/ratings/average',
  validateUUIDParam('ideaId'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const ideaId = req.params.ideaId;
    const stats = getRatingStats(ideaId);

    res.status(200).json(stats);
  })
);

export default router;
