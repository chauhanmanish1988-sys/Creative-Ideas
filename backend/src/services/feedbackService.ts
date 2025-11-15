import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../database/connection';
import {
  Feedback,
  FeedbackRow,
  FeedbackWithAuthor,
  CreateFeedbackRequest,
  feedbackRowToModel
} from '../models/Feedback';
import { AppError } from '../middleware/errorHandler';

/**
 * Check if user owns the idea (to prevent self-feedback)
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
 * Create a new feedback entry
 */
export function createFeedback(
  userId: string,
  ideaId: string,
  data: CreateFeedbackRequest
): Feedback {
  const { content } = data;

  // Validate ownership - prevent self-feedback
  if (isIdeaOwner(userId, ideaId)) {
    throw new AppError(403, 'FORBIDDEN_SELF_FEEDBACK', 'Cannot provide feedback on your own idea');
  }

  // Create feedback
  const feedbackId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO feedback (id, idea_id, user_id, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [feedbackId, ideaId, userId, content, now]
  );

  // Fetch created feedback
  const feedbackRow = queryOne<FeedbackRow>(
    'SELECT * FROM feedback WHERE id = ?',
    [feedbackId]
  );

  if (!feedbackRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create feedback');
  }

  return feedbackRowToModel(feedbackRow);
}

/**
 * Get all feedback for a specific idea
 */
export function getFeedbackByIdea(ideaId: string): FeedbackWithAuthor[] {
  const feedbackRows = query<FeedbackRow & { username: string }>(`
    SELECT 
      f.*,
      u.username
    FROM feedback f
    INNER JOIN users u ON f.user_id = u.id
    WHERE f.idea_id = ?
    ORDER BY f.created_at DESC
  `, [ideaId]);

  return feedbackRows.map(row => ({
    ...feedbackRowToModel(row),
    author: {
      id: row.user_id,
      username: row.username
    }
  }));
}
