import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../database/connection';
import {
  Idea,
  IdeaRow,
  IdeaWithEngagement,
  IdeaWithDetails,
  FeedbackItem,
  CreateIdeaRequest,
  IdeaListResponse,
  ideaRowToModel
} from '../models/Idea';
import { AppError } from '../middleware/errorHandler';

/**
 * Create a new idea
 */
export function createIdea(userId: string, data: CreateIdeaRequest): Idea {
  const { title, description } = data;

  // Create idea
  const ideaId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO ideas (id, user_id, title, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ideaId, userId, title, description, now, now]
  );

  // Fetch created idea
  const ideaRow = queryOne<IdeaRow>('SELECT * FROM ideas WHERE id = ?', [ideaId]);

  if (!ideaRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create idea');
  }

  return ideaRowToModel(ideaRow);
}

/**
 * Get ideas with pagination, sorting, and filtering
 */
export function getIdeas(
  page: number = 1,
  limit: number = 10,
  sortBy: 'date' | 'rating' | 'engagement' = 'date',
  minRating?: number,
  maxRating?: number,
  search?: string
): IdeaListResponse {
  // Validate pagination parameters
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  // Build query based on sort option
  let orderByClause = 'i.created_at DESC';
  if (sortBy === 'rating') {
    orderByClause = 'avg_rating DESC NULLS LAST, i.created_at DESC';
  } else if (sortBy === 'engagement') {
    orderByClause = 'feedback_count DESC, i.created_at DESC';
  }

  // Build WHERE clause for filters
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  // Search filter
  if (search && search.trim()) {
    whereClauses.push('i.title LIKE ?');
    queryParams.push(`%${search.trim()}%`);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Build HAVING clause for rating filter
  const havingClauses: string[] = [];
  if (minRating !== undefined && minRating >= 1 && minRating <= 5) {
    havingClauses.push('avg_rating >= ?');
    queryParams.push(minRating);
  }
  if (maxRating !== undefined && maxRating >= 1 && maxRating <= 5) {
    havingClauses.push('avg_rating <= ?');
    queryParams.push(maxRating);
  }

  const havingClause = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

  // Get ideas with engagement metrics
  const ideas = query<IdeaRow & {
    username: string;
    avg_rating: number | null;
    rating_count: number;
    feedback_count: number;
  }>(`
    SELECT 
      i.*,
      u.username,
      ROUND(AVG(r.score), 1) as avg_rating,
      COUNT(DISTINCT r.id) as rating_count,
      COUNT(DISTINCT f.id) as feedback_count
    FROM ideas i
    INNER JOIN users u ON i.user_id = u.id
    LEFT JOIN ratings r ON i.id = r.idea_id
    LEFT JOIN feedback f ON i.id = f.idea_id
    ${whereClause}
    GROUP BY i.id
    ${havingClause}
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `, [...queryParams, limit, offset]);

  // Get total count with filters
  const countQueryParams: any[] = [];
  if (search && search.trim()) {
    countQueryParams.push(`%${search.trim()}%`);
  }

  let countQuery = `
    SELECT COUNT(*) as total
    FROM (
      SELECT i.id
      FROM ideas i
      LEFT JOIN ratings r ON i.id = r.idea_id
      ${whereClause}
      GROUP BY i.id
      ${havingClause}
    ) as filtered_ideas
  `;

  const countResult = queryOne<{ total: number }>(countQuery, countQueryParams);
  const totalCount = countResult?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Transform to IdeaWithEngagement
  const ideasWithEngagement: IdeaWithEngagement[] = ideas.map(row => ({
    ...ideaRowToModel(row),
    author: {
      id: row.user_id,
      username: row.username
    },
    averageRating: row.avg_rating,
    ratingCount: row.rating_count,
    feedbackCount: row.feedback_count
  }));

  return {
    ideas: ideasWithEngagement,
    totalCount,
    page,
    totalPages
  };
}

/**
 * Get a single idea by ID with engagement metrics and feedback
 */
export function getIdeaById(ideaId: string): IdeaWithDetails | null {
  const result = queryOne<IdeaRow & {
    username: string;
    avg_rating: number | null;
    rating_count: number;
    feedback_count: number;
  }>(`
    SELECT 
      i.*,
      u.username,
      ROUND(AVG(r.score), 1) as avg_rating,
      COUNT(DISTINCT r.id) as rating_count,
      COUNT(DISTINCT f.id) as feedback_count
    FROM ideas i
    INNER JOIN users u ON i.user_id = u.id
    LEFT JOIN ratings r ON i.id = r.idea_id
    LEFT JOIN feedback f ON i.id = f.idea_id
    WHERE i.id = ?
    GROUP BY i.id
  `, [ideaId]);

  if (!result) {
    return null;
  }

  // Fetch feedback for this idea
  const feedbackRows = query<{
    id: string;
    idea_id: string;
    user_id: string;
    content: string;
    created_at: string;
    username: string;
  }>(`
    SELECT 
      f.id,
      f.idea_id,
      f.user_id,
      f.content,
      f.created_at,
      u.username
    FROM feedback f
    INNER JOIN users u ON f.user_id = u.id
    WHERE f.idea_id = ?
    ORDER BY f.created_at DESC
  `, [ideaId]);

  const feedback: FeedbackItem[] = feedbackRows.map(row => ({
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.user_id,
      username: row.username
    }
  }));

  return {
    ...ideaRowToModel(result),
    author: {
      id: result.user_id,
      username: result.username
    },
    averageRating: result.avg_rating,
    ratingCount: result.rating_count,
    feedbackCount: result.feedback_count,
    feedback
  };
}

/**
 * Get all ideas by a specific user
 */
export function getUserIdeas(userId: string): IdeaWithEngagement[] {
  const ideas = query<IdeaRow & {
    username: string;
    avg_rating: number | null;
    rating_count: number;
    feedback_count: number;
  }>(`
    SELECT 
      i.*,
      u.username,
      ROUND(AVG(r.score), 1) as avg_rating,
      COUNT(DISTINCT r.id) as rating_count,
      COUNT(DISTINCT f.id) as feedback_count
    FROM ideas i
    INNER JOIN users u ON i.user_id = u.id
    LEFT JOIN ratings r ON i.id = r.idea_id
    LEFT JOIN feedback f ON i.id = f.idea_id
    WHERE i.user_id = ?
    GROUP BY i.id
    ORDER BY i.created_at DESC
  `, [userId]);

  return ideas.map(row => ({
    ...ideaRowToModel(row),
    author: {
      id: row.user_id,
      username: row.username
    },
    averageRating: row.avg_rating,
    ratingCount: row.rating_count,
    feedbackCount: row.feedback_count
  }));
}
