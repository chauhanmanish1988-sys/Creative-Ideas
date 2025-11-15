-- Creative Ideas Platform Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK(length(username) >= 3 AND length(username) <= 30),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) >= 5 AND length(title) <= 100),
  description TEXT NOT NULL CHECK(length(description) >= 10),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK(length(content) >= 10),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idea_id, user_id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_idea_id ON feedback(idea_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_idea_id ON ratings(idea_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- Trigger to prevent self-feedback
CREATE TRIGGER IF NOT EXISTS prevent_self_feedback
BEFORE INSERT ON feedback
BEGIN
  SELECT CASE
    WHEN NEW.user_id = (SELECT user_id FROM ideas WHERE id = NEW.idea_id)
    THEN RAISE(ABORT, 'Cannot provide feedback on own idea')
  END;
END;

-- Trigger to prevent self-rating
CREATE TRIGGER IF NOT EXISTS prevent_self_rating
BEFORE INSERT ON ratings
BEGIN
  SELECT CASE
    WHEN NEW.user_id = (SELECT user_id FROM ideas WHERE id = NEW.idea_id)
    THEN RAISE(ABORT, 'Cannot rate own idea')
  END;
END;

-- Trigger to prevent updating rating to self-rate
CREATE TRIGGER IF NOT EXISTS prevent_self_rating_update
BEFORE UPDATE ON ratings
BEGIN
  SELECT CASE
    WHEN NEW.user_id = (SELECT user_id FROM ideas WHERE id = NEW.idea_id)
    THEN RAISE(ABORT, 'Cannot rate own idea')
  END;
END;
