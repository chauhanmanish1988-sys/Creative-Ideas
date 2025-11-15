/**
 * Feedback model interface
 */
export interface Feedback {
  id: string;
  ideaId: string;
  userId: string;
  content: string;
  createdAt: string;
}

/**
 * Feedback data from database (snake_case)
 */
export interface FeedbackRow {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

/**
 * Feedback with author information
 */
export interface FeedbackWithAuthor extends Feedback {
  author: {
    id: string;
    username: string;
  };
}

/**
 * Create feedback request
 */
export interface CreateFeedbackRequest {
  content: string;
}

/**
 * Convert database row to Feedback model
 */
export function feedbackRowToModel(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
  };
}
