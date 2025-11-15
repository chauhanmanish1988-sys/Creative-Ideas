// Sanitization utilities for XSS prevention

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Note: React already escapes content by default when rendering text,
 * but this utility is useful for additional safety when dealing with
 * user-generated content that might be used in attributes or other contexts
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * and patterns while preserving legitimate content
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitizes text content for safe display
 * Removes script tags and other potentially dangerous HTML
 */
export function sanitizeTextContent(content: string): string {
  if (!content) return '';
  
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

/**
 * Validates and sanitizes URL to prevent javascript: and data: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return url.trim();
}

/**
 * Sanitizes user profile data
 */
export function sanitizeUserData(data: { username?: string; email?: string; [key: string]: any }) {
  return {
    ...data,
    username: data.username ? sanitizeInput(data.username) : '',
    email: data.email ? sanitizeInput(data.email) : '',
  };
}

/**
 * Sanitizes idea data
 */
export function sanitizeIdeaData(data: { title?: string; description?: string; [key: string]: any }) {
  return {
    ...data,
    title: data.title ? sanitizeTextContent(data.title) : '',
    description: data.description ? sanitizeTextContent(data.description) : '',
  };
}

/**
 * Sanitizes feedback content
 */
export function sanitizeFeedbackContent(content: string): string {
  return sanitizeTextContent(content);
}

/**
 * Strips all HTML tags from a string, leaving only text content
 * Useful for displaying user content as plain text
 */
export function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
