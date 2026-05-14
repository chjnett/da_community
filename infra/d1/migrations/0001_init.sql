PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  real_name TEXT NOT NULL,
  dept TEXT,
  sid TEXT,
  password TEXT NOT NULL,
  is_dept_open INTEGER NOT NULL DEFAULT 0,
  is_sid_open INTEGER NOT NULL DEFAULT 0,
  university_code TEXT NOT NULL DEFAULT 'KYONGGI',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('CAMPUS', 'LOUNGE')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  board_id INTEGER NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(board_id) REFERENCES boards(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  author_id TEXT NOT NULL,
  input_title TEXT,
  input_content TEXT NOT NULL,
  toxicity_score REAL NOT NULL DEFAULT 0,
  harassment_score REAL NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL,
  suggestion TEXT,
  model TEXT NOT NULL,
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_author_created ON ai_reviews(author_id, created_at DESC);
