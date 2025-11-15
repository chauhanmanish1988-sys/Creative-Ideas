/**
 * User model interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User data from database (snake_case)
 */
export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * Public user data (without sensitive information)
 */
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

/**
 * User registration request
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * User login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: PublicUser;
  token: string;
}

/**
 * Convert database row to User model
 */
export function userRowToModel(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert User model to public user (remove sensitive data)
 */
export function userToPublic(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
