import { Router, Response } from 'express';
import { createFeedback, getFeedbackByIdea } from '../services/feedbackService';
import { CreateFeedbackRequest } from '../models/Feedback';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateFeedbackCreation, validateUUIDParam } from '../utils/validation';

const router = Router();

/**
 * POST /api/ideas/:ideaId/feedback
 * Create feedback for an idea (requires authentication)
 */
router.post(
  '/:ideaId/feedback',
  authenticateToken,
  validateUUIDParam('ideaId'),
  validateFeedbackCreation,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'User not authenticated');
    }

    const ideaId = req.params.ideaId;
    const data: CreateFeedbackRequest = req.body;
    const feedback = createFeedback(req.user.id, ideaId, data);

    res.status(201).json(feedback);
  })
);

/**
 * GET /api/ideas/:ideaId/feedback
 * Get all feedback for a specific idea
 */
router.get(
  '/:ideaId/feedback',
  validateUUIDParam('ideaId'),
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const ideaId = req.params.ideaId;
    const feedback = getFeedbackByIdea(ideaId);

    res.status(200).json(feedback);
  })
);

export default router;
