function toRows(result) {
  if (!result) return [];
  if (Array.isArray(result.results)) return result.results;
  return [];
}

function toFirst(result) {
  if (!result) return null;
  if (result.results && result.results[0]) return result.results[0];
  return null;
}

export function createD1Adapter(binding) {
  if (!binding) {
    throw new Error('[D1 Adapter] Missing D1 binding. Set DB_DRIVER=sqlite in local dev, or provide D1 binding in Workers runtime.');
  }

  const run = async (sql, ...params) => binding.prepare(sql).bind(...params).run();
  const all = async (sql, ...params) => toRows(await binding.prepare(sql).bind(...params).all());
  const first = async (sql, ...params) => toFirst(await binding.prepare(sql).bind(...params).all());

  return {
    dbPath: 'cloudflare:d1',

    countBoards: async () => Number((await first('SELECT COUNT(*) AS c FROM boards'))?.c ?? 0),
    insertBoard: async (id, name, slug, description, type) => run('INSERT INTO boards (id, name, slug, description, type) VALUES (?, ?, ?, ?, ?)', id, name, slug, description, type),
    listBoards: async () => all('SELECT id, name, slug, description, type FROM boards ORDER BY id ASC'),
    getBoardBySlug: async (slug) => first('SELECT id, name, slug, description, type FROM boards WHERE slug = ?', slug),
    hasBoardId: async (boardId) => Boolean(await first('SELECT id FROM boards WHERE id = ?', boardId)),

    countUsers: async () => Number((await first('SELECT COUNT(*) AS c FROM users'))?.c ?? 0),
    findUserByEmail: async (email) => first('SELECT * FROM users WHERE email = ?', email),
    findUserById: async (id) => first('SELECT * FROM users WHERE id = ?', id),
    createUser: async (user) =>
      run(
        `INSERT INTO users (id, email, real_name, dept, sid, password, is_dept_open, is_sid_open, university_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'KYONGGI', ?, ?)`,
        user.id,
        user.email,
        user.realName,
        user.dept,
        user.sid,
        user.password,
        user.isDeptOpen,
        user.isSidOpen,
        user.createdAt,
        user.updatedAt,
      ),
    updatePrivacy: async (userId, isDeptOpen, isSidOpen, updatedAt) => run('UPDATE users SET is_dept_open = ?, is_sid_open = ?, updated_at = ? WHERE id = ?', isDeptOpen, isSidOpen, updatedAt, userId),
    listUsersForHash: async () => all('SELECT id, password FROM users'),
    updateUserPassword: async (userId, hashed, updatedAt) => run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', hashed, updatedAt, userId),

    countPosts: async () => Number((await first('SELECT COUNT(*) AS c FROM posts'))?.c ?? 0),
    createPost: async (post) =>
      run(
        'INSERT INTO posts (id, board_id, author_id, title, content, images_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        post.id,
        post.boardId,
        post.authorId,
        post.title,
        post.content,
        post.imagesJson,
        post.createdAt,
        post.updatedAt,
      ),
    getPostById: async (postId) =>
      first(
        `SELECT p.id, p.board_id, p.title, p.content, p.images_json, p.created_at, p.updated_at,
                u.id AS author_id, u.real_name, u.dept, u.sid
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.id = ?`,
        postId,
      ),
    updatePost: async (postId, title, content, imagesJson, updatedAt) => run('UPDATE posts SET title = ?, content = ?, images_json = ?, updated_at = ? WHERE id = ?', title, content, imagesJson, updatedAt, postId),
    deletePost: async (postId) => run('DELETE FROM posts WHERE id = ?', postId),
    listPostsByBoard: async (boardId, limit, offset) =>
      all(
        `SELECT p.id, p.title, p.content, p.created_at, u.real_name, u.dept, u.sid
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.board_id = ?
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        boardId,
        limit,
        offset,
      ),
    countPostsByBoard: async (boardId) => Number((await first('SELECT COUNT(*) AS total FROM posts WHERE board_id = ?', boardId))?.total ?? 0),
    listPostIdsByBoard: async (boardId) => all('SELECT id FROM posts WHERE board_id = ? ORDER BY created_at DESC', boardId),

    // Replies
    listReplies: async (postId) =>
      all(
        `SELECT r.id, r.post_id, r.content, r.created_at,
                u.id AS author_id, u.real_name, u.dept, u.sid
         FROM replies r
         JOIN users u ON u.id = r.author_id
         WHERE r.post_id = ?
         ORDER BY r.created_at ASC`,
        postId,
      ),
    insertReply: async (data) => run('INSERT INTO replies (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)', data.id, data.postId, data.authorId, data.content, data.createdAt),
    getReplyById: async (id) =>
      first(
        `SELECT r.id, r.post_id, r.content, r.created_at,
                u.id AS author_id, u.real_name, u.dept, u.sid
         FROM replies r
         JOIN users u ON u.id = r.author_id
         WHERE r.id = ?`,
        id,
      ),
  };
}
