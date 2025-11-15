import { Router, Request, Response } from 'express';
import { createIdea, getIdeas, getIdeaById } from '../services/ideaService';
import { CreateIdeaRequest } from '../models/Idea';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateIdeaCreation, validateUUIDParam } from '../utils/validation';

const router = Router();

/**
 * POST /api/ideas
 * Create a new idea (requires authentication)
 */
router.post(
  '/',
  authenticateToken,
  validateIdeaCreation,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(401, 'AUTH_TOKEN_INVALID', 'User not authenticated');
    }

    const data: CreateIdeaRequest = req.body;
    const idea = createIdea(req.user.id, data);

    res.status(201).json({ idea });
  })
);

/**
 * GET /api/ideas
 * Get paginated list of ideas with sorting and filtering
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as 'date' | 'rating' | 'engagement') || 'date';
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const maxRating = req.query.maxRating ? parseFloat(req.query.maxRating as string) : undefined;
    const search = req.query.search as string | undefined;

    // Validate sortBy parameter
    if (!['date', 'rating', 'engagement'].includes(sortBy)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'Invalid sortBy parameter. Must be one of: date, rating, engagement'
      );
    }

    // Validate rating parameters
    if (minRating !== undefined && (minRating < 1 || minRating > 5)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'minRating must be between 1 and 5'
      );
    }
    if (maxRating !== undefined && (maxRating < 1 || maxRating > 5)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'maxRating must be between 1 and 5'
      );
    }
    if (minRating !== undefined && maxRating !== undefined && minRating > maxRating) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        'minRating cannot be greater than maxRating'
      );
    }

    const result = getIdeas(page, limit, sortBy, minRating, maxRating, search);
    res.status(200).json(result);
  })
);

/**
 * GET /api/ideas/:id
 * Get a single idea by ID with full details
 */
router.get(
  '/:id',
  validateUUIDParam('id'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ideaId = req.params.id;
    const idea = getIdeaById(ideaId);

    if (!idea) {
      throw new AppError(404, 'IDEA_NOT_FOUND', 'Idea not found');
    }

    res.status(200).json({ idea });
  })
);

export default router;
