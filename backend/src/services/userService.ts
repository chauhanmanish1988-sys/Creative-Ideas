import { queryOne, execute } from '../database/connection';
import { 
  UserRow, 
  PublicUser, 
  UpdateUserRequest,
  userRowToModel,
  userToPublic 
} from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { isValidEmail, isValidUsername } from '../utils/validation';

/**
 * User statistics interface
 */
export interface UserStats {
  ideaCount: number;
  feedbackCount: number;
}

/**
 * User profile with statistics
 */
export interface UserProfile extends PublicUser {
  ideaCount: number;
  feedbackCount: number;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): PublicUser | null {
  const userRow = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);

  if (!userRow) {
    return null;
  }

  const user = userRowToModel(userRow);
  return userToPublic(user);
}

/**
 * Update user profile
 */
export function updateUser(userId: string, updates: UpdateUserRequest): PublicUser {
  // Validate that user exists
  const existingUser = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!existingUser) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Validate updates
  if (updates.username !== undefined) {
    if (!isValidUsername(updates.username)) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Username must be 3-30 characters and contain only letters, numbers, and underscores');
    }

    // Check if username is already taken by another user
    const userWithUsername = queryOne<UserRow>(
      'SELECT * FROM users WHERE username = ? AND id != ?',
      [updates.username, userId]
    );

    if (userWithUsername) {
      throw new AppError(409, 'USER_EXISTS', 'Username already taken');
    }
  }

  if (updates.email !== undefined) {
    if (!isValidEmail(updates.email)) {
      throw new AppError(400, 'VALIDATION_FAILED', 'Invalid email format');
    }

    // Check if email is already taken by another user
    const userWithEmail = queryOne<UserRow>(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [updates.email, userId]
    );

    if (userWithEmail) {
      throw new AppError(409, 'USER_EXISTS', 'Email already registered');
    }
  }

  // Build update query dynamically
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (updates.username !== undefined) {
    updateFields.push('username = ?');
    updateValues.push(updates.username);
  }

  if (updates.email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(updates.email);
  }

  // Always update the updated_at timestamp
  updateFields.push('updated_at = ?');
  updateValues.push(new Date().toISOString());

  // Add userId to the end for WHERE clause
  updateValues.push(userId);

  // Execute update
  execute(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  // Fetch and return updated user
  const updatedUserRow = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!updatedUserRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to retrieve updated user');
  }

  const updatedUser = userRowToModel(updatedUserRow);
  return userToPublic(updatedUser);
}

/**
 * Get user activity statistics
 */
export function getUserStats(userId: string): UserStats {
  // Get idea count
  const ideaCountResult = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM ideas WHERE user_id = ?',
    [userId]
  );

  // Get feedback count
  const feedbackCountResult = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM feedback WHERE user_id = ?',
    [userId]
  );

  return {
    ideaCount: ideaCountResult?.count || 0,
    feedbackCount: feedbackCountResult?.count || 0,
  };
}

/**
 * Get user profile with statistics
 */
export function getUserProfile(userId: string): UserProfile | null {
  const user = getUserById(userId);
  
  if (!user) {
    return null;
  }

  const stats = getUserStats(userId);

  return {
    ...user,
    ...stats,
  };
}
