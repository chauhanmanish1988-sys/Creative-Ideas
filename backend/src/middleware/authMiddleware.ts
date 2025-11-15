import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../services/authService';
import { PublicUser } from '../models/User';
import { AppError } from './errorHandler';

/**
 * Extend Express Request to include user information
 */
export interface AuthRequest extends Request {
  user?: PublicUser;
  userId?: string;
}

/**
 * Middleware to verify JWT token and extract user information
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new AppError(401, 'AUTH_TOKEN_MISSING', 'No authentication token provided');
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError(401, 'AUTH_TOKEN_INVALID', 'Invalid token format. Expected: Bearer <token>');
  }

  const token = parts[1];

  // Verify token (throws AppError if invalid)
  const payload = verifyToken(token);

  // Get user information
  const user = getUserById(payload.userId);

  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Attach user information to request
  req.user = user;
  req.userId = user.id;

  next();
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];

    try {
      const payload = verifyToken(token);
      const user = getUserById(payload.userId);

      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
}
