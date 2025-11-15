import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/creative-ideas.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database | null = null;

/**
 * Initialize the database connection and create tables if they don't exist
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create database connection
  db = new Database(DB_PATH);
  
  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('Database initialized successfully');
  
  return db;
}

/**
 * Get the database connection instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute a query that returns multiple rows
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Execute a query that returns a single row
 */
export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params: any[] = []): Database.RunResult {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute multiple statements in a transaction
 */
export function transaction<T>(callback: () => T): T {
  const database = getDatabase();
  const txn = database.transaction(callback);
  return txn();
}

/**
 * Execute multiple statements in a transaction with error handling
 */
export function transactionAsync<T>(callback: () => T): T {
  const database = getDatabase();
  try {
    return transaction(callback);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
