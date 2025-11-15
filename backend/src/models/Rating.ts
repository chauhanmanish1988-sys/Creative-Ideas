/**
 * Rating model interface
 */
export interface Rating {
  id: string;
  ideaId: string;
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rating data from database (snake_case)
 */
export interface RatingRow {
  id: string;
  idea_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create rating request
 */
export interface CreateRatingRequest {
  score: number;
}

/**
 * Update rating request
 */
export interface UpdateRatingRequest {
  score: number;
}

/**
 * Rating statistics for an idea
 */
export interface RatingStats {
  averageRating: number | null;
  count: number;
}

/**
 * Convert database row to Rating model
 */
export function ratingRowToModel(row: RatingRow): Rating {
  return {
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
