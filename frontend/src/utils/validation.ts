// Validation utility functions for frontend forms

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
}

/**
 * Validates username
 */
export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { isValid: false, error: 'Username must not exceed 30 characters' };
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must not exceed 128 characters' };
  }
  
  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }
  
  return { isValid: true };
}

/**
 * Validates idea title
 */
export function validateIdeaTitle(title: string): ValidationResult {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (title.length < 5) {
    return { isValid: false, error: 'Title must be at least 5 characters' };
  }
  
  if (title.length > 100) {
    return { isValid: false, error: 'Title must not exceed 100 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validates idea description
 */
export function validateIdeaDescription(description: string): ValidationResult {
  if (!description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }
  
  if (description.length < 10) {
    return { isValid: false, error: 'Description must be at least 10 characters' };
  }
  
  if (description.length > 5000) {
    return { isValid: false, error: 'Description must not exceed 5000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validates feedback content
 */
export function validateFeedbackContent(content: string): ValidationResult {
  if (!content.trim()) {
    return { isValid: false, error: 'Feedback is required' };
  }
  
  if (content.trim().length < 10) {
    return { isValid: false, error: 'Feedback must be at least 10 characters' };
  }
  
  if (content.length > 2000) {
    return { isValid: false, error: 'Feedback must not exceed 2000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validates rating score
 */
export function validateRating(score: number): ValidationResult {
  if (!Number.isInteger(score)) {
    return { isValid: false, error: 'Rating must be a whole number' };
  }
  
  if (score < 1 || score > 5) {
    return { isValid: false, error: 'Rating must be between 1 and 5' };
  }
  
  return { isValid: true };
}
