import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../database/connection';
import {
  Rating,
  RatingRow,
  RatingStats,
  CreateRatingRequest,
  UpdateRatingRequest,
  ratingRowToModel
} from '../models/Rating';
import { AppError } from '../middleware/errorHandler';

/**
 * Check if user owns the idea (to prevent self-rating)
 */
function isIdeaOwner(userId: string, ideaId: string): boolean {
  const result = queryOne<{ user_id: string }>(
    'SELECT user_id FROM ideas WHERE id = ?',
    [ideaId]
  );

  if (!result) {
    throw new AppError(404, 'IDEA_NOT_FOUND', 'Idea not found');
  }

  return result.user_id === userId;
}

/**
 * Check if user has already rated an idea
 */
function hasUserRated(userId: string, ideaId: string): boolean {
  const result = queryOne<{ id: string }>(
    'SELECT id FROM ratings WHERE user_id = ? AND idea_id = ?',
    [userId, ideaId]
  );

  return !!result;
}

/**
 * Create a new rating
 */
export function createRating(
  userId: string,
  ideaId: string,
  data: CreateRatingRequest
): Rating {
  const { score } = data;

  // Validate ownership - prevent self-rating
  if (isIdeaOwner(userId, ideaId)) {
    throw new AppError(403, 'FORBIDDEN_SELF_RATING', 'Cannot rate your own idea');
  }

  // Check if user has already rated this idea
  if (hasUserRated(userId, ideaId)) {
    throw new AppError(409, 'RATING_EXISTS', 'User has already rated this idea. Use update instead.');
  }

  // Create rating
  const ratingId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO ratings (id, idea_id, user_id, score, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ratingId, ideaId, userId, score, now, now]
  );

  // Fetch created rating
  const ratingRow = queryOne<RatingRow>(
    'SELECT * FROM ratings WHERE id = ?',
    [ratingId]
  );

  if (!ratingRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create rating');
  }

  return ratingRowToModel(ratingRow);
}

/**
 * Update an existing rating
 */
export function updateRating(
  userId: string,
  ideaId: string,
  data: UpdateRatingRequest
): Rating {
  const { score } = data;

  // Validate ownership - prevent self-rating
  if (isIdeaOwner(userId, ideaId)) {
    throw new AppError(403, 'FORBIDDEN_SELF_RATING', 'Cannot rate your own idea');
  }

  // Check if rating exists
  if (!hasUserRated(userId, ideaId)) {
    throw new AppError(404, 'RATING_NOT_FOUND', 'Rating not found. Create a new rating instead.');
  }

  // Update rating
  const now = new Date().toISOString();

  execute(
    `UPDATE ratings 
     SET score = ?, updated_at = ?
     WHERE user_id = ? AND idea_id = ?`,
    [score, now, userId, ideaId]
  );

  // Fetch updated rating
  const ratingRow = queryOne<RatingRow>(
    'SELECT * FROM ratings WHERE user_id = ? AND idea_id = ?',
    [userId, ideaId]
  );

  if (!ratingRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to update rating');
  }

  return ratingRowToModel(ratingRow);
}

/**
 * Get average rating for an idea
 */
export function getAverageRating(ideaId: string): number | null {
  const result = queryOne<{ avg_rating: number | null }>(
    'SELECT AVG(score) as avg_rating FROM ratings WHERE idea_id = ?',
    [ideaId]
  );

  if (!result || result.avg_rating === null) {
    return null;
  }

  // Round to one decimal place
  return Math.round(result.avg_rating * 10) / 10;
}

/**
 * Get rating count for an idea
 */
export function getRatingCount(ideaId: string): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM ratings WHERE idea_id = ?',
    [ideaId]
  );

  return result?.count || 0;
}

/**
 * Get rating statistics for an idea
 */
export function getRatingStats(ideaId: string): RatingStats {
  return {
    averageRating: getAverageRating(ideaId),
    count: getRatingCount(ideaId)
  };
}
