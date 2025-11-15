// Export all models and types
export * from './User';
export * from './Idea';
export * from './Feedback';
export * from './Rating';

/**
 * Common API response types
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * User statistics
 */
export interface UserStats {
  ideaCount: number;
  feedbackCount: number;
}

/**
 * User profile with statistics
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  ideaCount: number;
  feedbackCount: number;
}
