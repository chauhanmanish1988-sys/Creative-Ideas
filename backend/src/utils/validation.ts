import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

/**
 * Email validation using regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Password strength validation
 * Requirements:
 * - At least 8 characters
 * - Contains at least one letter
 * - Contains at least one number
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Minimum 8 characters
  if (password.length < 8) {
    return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return false;
  }

  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Username validation
 * Requirements:
 * - 3-30 characters
 * - Alphanumeric and underscores only
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const trimmed = username.trim();
  
  // Length check
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false;
  }

  // Alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(trimmed);
}

/**
 * Idea title validation
 * Requirements: 5-100 characters
 */
export function isValidIdeaTitle(title: string): boolean {
  if (!title || typeof title !== 'string') {
    return false;
  }

  const trimmed = title.trim();
  return trimmed.length >= 5 && trimmed.length <= 100;
}

/**
 * Idea description validation
 * Requirements: 10-5000 characters
 */
export function isValidIdeaDescription(description: string): boolean {
  if (!description || typeof description !== 'string') {
    return false;
  }

  const trimmed = description.trim();
  return trimmed.length >= 10 && trimmed.length <= 5000;
}

/**
 * Feedback content validation
 * Requirements: Minimum 10 characters
 */
export function isValidFeedbackContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const trimmed = content.trim();
  return trimmed.length >= 10;
}

/**
 * Rating score validation
 * Requirements: Integer between 1 and 5
 */
export function isValidRatingScore(score: any): boolean {
  if (typeof score !== 'number') {
    return false;
  }

  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/**
 * UUID validation
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize email by converting to lowercase and trimming
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

/**
 * Validation error details
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Middleware to validate registration request
 */
export function validateRegistration(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { username, email, password } = req.body;
  const errors: ValidationError[] = [];

  // Validate username
  if (!username) {
    errors.push({ field: 'username', message: 'Username is required' });
  } else if (!isValidUsername(username)) {
    errors.push({ 
      field: 'username', 
      message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' 
    });
  }

  // Validate email
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!isValidPassword(password)) {
    errors.push({ 
      field: 'password', 
      message: 'Password must be at least 8 characters and contain at least one letter and one number' 
    });
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  // Sanitize inputs
  req.body.username = sanitizeString(username);
  req.body.email = sanitizeEmail(email);

  next();
}

/**
 * Middleware to validate login request
 */
export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { email, password } = req.body;
  const errors: ValidationError[] = [];

  // Validate email
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  // Sanitize email
  req.body.email = sanitizeEmail(email);

  next();
}

/**
 * Middleware to validate idea creation request
 */
export function validateIdeaCreation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { title, description } = req.body;
  const errors: ValidationError[] = [];

  // Validate title
  if (!title) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (!isValidIdeaTitle(title)) {
    errors.push({ 
      field: 'title', 
      message: 'Title must be between 5 and 100 characters' 
    });
  }

  // Validate description
  if (!description) {
    errors.push({ field: 'description', message: 'Description is required' });
  } else if (!isValidIdeaDescription(description)) {
    errors.push({ 
      field: 'description', 
      message: 'Description must be between 10 and 5000 characters' 
    });
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  // Sanitize inputs
  req.body.title = sanitizeString(title);
  req.body.description = sanitizeString(description);

  next();
}

/**
 * Middleware to validate feedback creation request
 */
export function validateFeedbackCreation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { content } = req.body;
  const errors: ValidationError[] = [];

  // Validate content
  if (!content) {
    errors.push({ field: 'content', message: 'Content is required' });
  } else if (!isValidFeedbackContent(content)) {
    errors.push({ 
      field: 'content', 
      message: 'Content must be at least 10 characters' 
    });
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  // Sanitize input
  req.body.content = sanitizeString(content);

  next();
}

/**
 * Middleware to validate rating creation/update request
 */
export function validateRating(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { score } = req.body;
  const errors: ValidationError[] = [];

  // Validate score
  if (score === undefined || score === null) {
    errors.push({ field: 'score', message: 'Score is required' });
  } else if (!isValidRatingScore(score)) {
    errors.push({ 
      field: 'score', 
      message: 'Score must be an integer between 1 and 5' 
    });
  }

  if (errors.length > 0) {
    throw new AppError(400, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  next();
}

/**
 * Middleware to validate UUID parameter
 */
export function validateUUIDParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value) {
      throw new AppError(400, 'VALIDATION_FAILED', `${paramName} is required`);
    }

    if (!isValidUUID(value)) {
      throw new AppError(400, 'VALIDATION_FAILED', `Invalid ${paramName} format`);
    }

    next();
  };
}
