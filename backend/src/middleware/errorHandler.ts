import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Log error with context
 */
function logError(error: Error | AppError, req: Request): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userId = (req as any).user?.id || 'anonymous';

  console.error('='.repeat(80));
  console.error(`[${timestamp}] Error occurred`);
  console.error(`Method: ${method} ${url}`);
  console.error(`User: ${userId}`);
  console.error(`Error: ${error.message}`);
  
  if (error instanceof AppError) {
    console.error(`Status: ${error.statusCode}`);
    console.error(`Code: ${error.code}`);
    if (error.details) {
      console.error(`Details:`, JSON.stringify(error.details, null, 2));
    }
  }
  
  console.error(`Stack: ${error.stack}`);
  console.error('='.repeat(80));
}

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError(err, req);

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle database constraint errors
  if (err.message.includes('UNIQUE constraint failed')) {
    const response: ErrorResponse = {
      error: {
        code: 'CONSTRAINT_VIOLATION',
        message: 'A record with this value already exists'
      }
    };
    res.status(409).json(response);
    return;
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    const response: ErrorResponse = {
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist'
      }
    };
    res.status(400).json(response);
    return;
  }

  if (err.message.includes('CHECK constraint failed')) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Data validation failed'
      }
    };
    res.status(400).json(response);
    return;
  }

  // Handle specific error messages from triggers
  if (err.message.includes('Cannot provide feedback on own idea')) {
    const response: ErrorResponse = {
      error: {
        code: 'FORBIDDEN_SELF_FEEDBACK',
        message: 'Cannot provide feedback on your own idea'
      }
    };
    res.status(403).json(response);
    return;
  }

  if (err.message.includes('Cannot rate own idea')) {
    const response: ErrorResponse = {
      error: {
        code: 'FORBIDDEN_SELF_RATING',
        message: 'Cannot rate your own idea'
      }
    };
    res.status(403).json(response);
    return;
  }

  // Default to 500 Internal Server Error
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  };
  res.status(500).json(response);
}

/**
 * 404 Not Found handler
 * Should be registered after all routes but before error handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  };
  res.status(404).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
