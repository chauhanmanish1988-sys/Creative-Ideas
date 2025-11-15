import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, execute } from '../database/connection';
import { 
  UserRow, 
  PublicUser, 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  userRowToModel,
  userToPublic 
} from '../models/User';
import { AppError } from '../middleware/errorHandler';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch (error) {
    throw new AppError(401, 'AUTH_TOKEN_INVALID', 'Invalid or expired token');
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const { username, email, password } = data;

  // Check if user already exists
  const existingUser = queryOne<UserRow>(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username]
  );

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError(409, 'USER_EXISTS', 'Email already registered');
    }
    if (existingUser.username === username) {
      throw new AppError(409, 'USER_EXISTS', 'Username already taken');
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, email, passwordHash, now, now]
  );

  // Fetch created user
  const userRow = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!userRow) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create user');
  }

  const user = userRowToModel(userRow);
  const token = generateToken(user.id);

  return {
    user: userToPublic(user),
    token
  };
}

/**
 * Login a user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const userRow = queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [email]);

  if (!userRow) {
    throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, userRow.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const user = userRowToModel(userRow);
  const token = generateToken(user.id);

  return {
    user: userToPublic(user),
    token
  };
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
