import { queryOne } from '../database/connection';

/**
 * Calculate feedback count for a specific idea
 */
export function calculateFeedbackCount(ideaId: string): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM feedback WHERE idea_id = ?',
    [ideaId]
  );

  return result?.count || 0;
}

/**
 * Calculate rating count for a specific idea
 */
export function calculateRatingCount(ideaId: string): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM ratings WHERE idea_id = ?',
    [ideaId]
  );

  return result?.count || 0;
}

/**
 * Format average rating to one decimal place
 */
export function formatAverageRating(averageRating: number | null): number | null {
  if (averageRating === null) {
    return null;
  }

  return Math.round(averageRating * 10) / 10;
}

/**
 * Calculate average rating for a specific idea
 */
export function calculateAverageRating(ideaId: string): number | null {
  const result = queryOne<{ avg_rating: number | null }>(
    'SELECT AVG(score) as avg_rating FROM ratings WHERE idea_id = ?',
    [ideaId]
  );

  if (!result || result.avg_rating === null) {
    return null;
  }

  return formatAverageRating(result.avg_rating);
}

/**
 * Get all engagement metrics for an idea
 */
export function getEngagementMetrics(ideaId: string): {
  feedbackCount: number;
  ratingCount: number;
  averageRating: number | null;
} {
  return {
    feedbackCount: calculateFeedbackCount(ideaId),
    ratingCount: calculateRatingCount(ideaId),
    averageRating: calculateAverageRating(ideaId)
  };
}
