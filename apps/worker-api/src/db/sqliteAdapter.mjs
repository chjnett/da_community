import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function createSqliteAdapter(cwd = process.cwd()) {
  const dataDir = path.resolve(cwd, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'dev.db');
  const db = new DatabaseSync(dbPath);

  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
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
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  board_id INTEGER NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images_json TEXT NOT NULL DEFAULT '[]',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(board_id) REFERENCES boards(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_post_created ON replies(post_id, created_at ASC);
`);

  const stmts = {
    listBoards: db.prepare('SELECT id, name, slug, description, type FROM boards ORDER BY id ASC'),
    getBoardBySlug: db.prepare('SELECT id, name, slug, description, type FROM boards WHERE slug = ?'),
    getBoardById: db.prepare('SELECT id FROM boards WHERE id = ?'),
    countBoards: db.prepare('SELECT COUNT(*) AS c FROM boards'),
    insertBoard: db.prepare('INSERT INTO boards (id, name, slug, description, type) VALUES (?, ?, ?, ?, ?)'),

    listPostsByBoard: db.prepare(`
SELECT p.id, p.title, p.content, p.created_at, p.likes_count, u.real_name, u.dept, u.sid,
       (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies_count
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.board_id = ?
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?`),
    listPostIdsByBoard: db.prepare('SELECT id FROM posts WHERE board_id = ? ORDER BY created_at DESC'),
    countPostsByBoard: db.prepare('SELECT COUNT(*) AS total FROM posts WHERE board_id = ?'),
    countPosts: db.prepare('SELECT COUNT(*) AS c FROM posts'),
    createPost: db.prepare('INSERT INTO posts (id, board_id, author_id, title, content, images_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
    getPostById: db.prepare(`
SELECT p.id, p.board_id, p.title, p.content, p.images_json, p.likes_count, p.created_at, p.updated_at,
       u.id AS author_id, u.real_name, u.dept, u.sid,
       (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies_count
FROM posts p
JOIN users u ON u.id = p.author_id
WHERE p.id = ?`),
    updatePost: db.prepare('UPDATE posts SET title = ?, content = ?, images_json = ?, updated_at = ? WHERE id = ?'),
    deletePost: db.prepare('DELETE FROM posts WHERE id = ?'),
    incrementLikes: db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?'),

    // Replies
    listRepliesByPost: db.prepare(`
SELECT r.id, r.post_id, r.content, r.created_at,
       u.id AS author_id, u.real_name, u.dept, u.sid
FROM replies r
JOIN users u ON u.id = r.author_id
WHERE r.post_id = ?
ORDER BY r.created_at ASC`),
    insertReply: db.prepare('INSERT INTO replies (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)'),
    getReplyById: db.prepare(`
SELECT r.id, r.post_id, r.content, r.created_at,
       u.id AS author_id, u.real_name, u.dept, u.sid
FROM replies r
JOIN users u ON u.id = r.author_id
WHERE r.id = ?`),

    countUsers: db.prepare('SELECT COUNT(*) AS c FROM users'),
    listUsersForHash: db.prepare('SELECT id, password FROM users'),
    findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    createUser: db.prepare(`
INSERT INTO users (id, email, real_name, dept, sid, password, is_dept_open, is_sid_open, university_code, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'KYONGGI', ?, ?)`),
    updatePrivacy: db.prepare('UPDATE users SET is_dept_open = ?, is_sid_open = ?, updated_at = ? WHERE id = ?'),
    updateUserPassword: db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?'),

    getUserStats: db.prepare(`
SELECT 
  (SELECT COUNT(*) FROM posts WHERE author_id = ?) AS post_count,
  (SELECT COUNT(*) FROM replies WHERE author_id = ?) AS reply_count,
  (SELECT SUM(likes_count) FROM posts WHERE author_id = ?) AS total_likes
`),
  };

  return {
    dbPath,
    countBoards: async () => Number(stmts.countBoards.get().c),
    insertBoard: async (id, name, slug, description, type) => stmts.insertBoard.run(id, name, slug, description, type),
    listBoards: async () => stmts.listBoards.all(),
    getBoardBySlug: async (slug) => stmts.getBoardBySlug.get(slug),
    hasBoardId: async (boardId) => Boolean(stmts.getBoardById.get(boardId)),

    countUsers: async () => Number(stmts.countUsers.get().c),
    findUserByEmail: async (email) => stmts.findUserByEmail.get(email),
    findUserById: async (id) => stmts.findUserById.get(id),
    createUser: async (user) => stmts.createUser.run(user.id, user.email, user.realName, user.dept, user.sid, user.password, user.isDeptOpen, user.isSidOpen, user.createdAt, user.updatedAt),
    updatePrivacy: async (userId, isDeptOpen, isSidOpen, updatedAt) => stmts.updatePrivacy.run(isDeptOpen, isSidOpen, updatedAt, userId),
    listUsersForHash: async () => stmts.listUsersForHash.all(),
    updateUserPassword: async (userId, hashed, updatedAt) => stmts.updateUserPassword.run(hashed, updatedAt, userId),
    getUserStats: async (userId) => {
      const row = stmts.getUserStats.get(userId, userId, userId);
      return {
        postCount: row.post_count || 0,
        replyCount: row.reply_count || 0,
        likeCount: row.total_likes || 0
      };
    },

    countPosts: async () => Number(stmts.countPosts.get().c),
    createPost: async (post) => stmts.createPost.run(post.id, post.boardId, post.authorId, post.title, post.content, post.imagesJson, post.createdAt, post.updatedAt),
    getPostById: async (postId) => stmts.getPostById.get(postId),
    updatePost: async (postId, title, content, imagesJson, updatedAt) => stmts.updatePost.run(title, content, imagesJson, updatedAt, postId),
    deletePost: async (postId) => stmts.deletePost.run(postId),
    incrementLikes: async (postId) => stmts.incrementLikes.run(postId),
    listPostsByBoard: async (boardId, limit, offset) => stmts.listPostsByBoard.all(boardId, limit, offset),
    countPostsByBoard: async (boardId) => Number(stmts.countPostsByBoard.get(boardId).total),
    listPostIdsByBoard: async (boardId) => stmts.listPostIdsByBoard.all(boardId),

    // Reply Methods
    listReplies: async (postId) => stmts.listRepliesByPost.all(postId),
    insertReply: async (data) => stmts.insertReply.run(data.id, data.postId, data.authorId, data.content, data.createdAt),
    getReplyById: async (id) => stmts.getReplyById.get(id),
  };
}
