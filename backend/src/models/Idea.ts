/**
 * Idea model interface
 */
export interface Idea {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Idea data from database (snake_case)
 */
export interface IdeaRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * Idea with author information
 */
export interface IdeaWithAuthor extends Idea {
  author: {
    id: string;
    username: string;
  };
}

/**
 * Idea with engagement metrics
 */
export interface IdeaWithEngagement extends IdeaWithAuthor {
  averageRating: number | null;
  ratingCount: number;
  feedbackCount: number;
}

/**
 * Feedback item for idea details
 */
export interface FeedbackItem {
  id: string;
  ideaId: string;
  userId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
  };
}

/**
 * Idea with full details including feedback
 */
export interface IdeaWithDetails extends IdeaWithEngagement {
  feedback: FeedbackItem[];
}

/**
 * Create idea request
 */
export interface CreateIdeaRequest {
  title: string;
  description: string;
}

/**
 * Idea list response with pagination
 */
export interface IdeaListResponse {
  ideas: IdeaWithEngagement[];
  totalCount: number;
  page: number;
  totalPages: number;
}

/**
 * Convert database row to Idea model
 */
export function ideaRowToModel(row: IdeaRow): Idea {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
