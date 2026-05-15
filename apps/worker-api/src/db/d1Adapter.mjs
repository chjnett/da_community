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
        `INSERT INTO users (id, email, real_name, dept, sid, password, role, is_dept_open, is_sid_open, university_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'KYONGGI', ?, ?)`,
        user.id,
        user.email,
        user.realName,
        user.dept,
        user.sid,
        user.password,
        user.role || 'USER',
        user.isDeptOpen,
        user.isSidOpen,
        user.createdAt,
        user.updatedAt,
      ),
    updatePrivacy: async (userId, isDeptOpen, isSidOpen, updatedAt) => run('UPDATE users SET is_dept_open = ?, is_sid_open = ?, updated_at = ? WHERE id = ?', isDeptOpen, isSidOpen, updatedAt, userId),
    listUsersForHash: async () => all('SELECT id, password FROM users'),
    updateUserPassword: async (userId, hashed, updatedAt) => run('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', hashed, updatedAt, userId),
    
    getUserStats: async (userId) => {
      const stats = await first(`
        SELECT 
          (SELECT COUNT(*) FROM posts WHERE author_id = ?) AS postCount,
          (SELECT COUNT(*) FROM replies WHERE author_id = ?) AS replyCount,
          (SELECT SUM(likes_count) FROM posts WHERE author_id = ?) AS likeCount,
          (SELECT COUNT(*) FROM ai_reviews WHERE author_id = ? AND verdict = 'SOFT_WARN') as warnCount,
          (SELECT COUNT(*) FROM ai_reviews WHERE author_id = ? AND verdict = 'BLOCK') as blockCount
      `, userId, userId, userId, userId, userId);

      // 커뮤니티 온도 계산 (기본 36.5도, 경고당 -0.5도, 차단당 -2도)
      const baseTemp = 36.5;
      const penalty = (Number(stats?.warnCount || 0) * 0.5) + (Number(stats?.blockCount || 0) * 2.0);
      const temperature = Math.max(10.0, baseTemp - penalty);

      return {
        postCount: stats?.postCount || 0,
        replyCount: stats?.replyCount || 0,
        likeCount: stats?.likeCount || 0,
        warnCount: stats?.warnCount || 0,
        blockCount: stats?.blockCount || 0,
        temperature: parseFloat(temperature.toFixed(1))
      };
    },

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
        `SELECT p.id, p.board_id, p.title, p.content, p.images_json, p.likes_count, p.created_at, p.updated_at,
                u.id AS author_id, u.real_name, u.dept, u.sid,
                (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies_count
         FROM posts p
         JOIN users u ON u.id = p.author_id
         WHERE p.id = ?`,
        postId,
      ),
    updatePost: async (postId, title, content, imagesJson, updatedAt) => run('UPDATE posts SET title = ?, content = ?, images_json = ?, updated_at = ? WHERE id = ?', title, content, imagesJson, updatedAt, postId),
    deletePost: async (postId) => run('DELETE FROM posts WHERE id = ?', postId),
    incrementLikes: async (postId) => run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', postId),
    listPostsByBoard: async (boardId, limit, offset) =>
      all(
        `SELECT p.id, p.title, p.content, p.created_at, p.likes_count, u.real_name, u.dept, u.sid,
                (SELECT COUNT(*) FROM replies WHERE post_id = p.id) AS replies_count
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

    // AI Review Methods
    insertAiReview: async (data) => run(
      `INSERT INTO ai_reviews (id, post_id, author_id, input_title, input_content, toxicity_score, harassment_score, verdict, suggestion, model, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.id, 
      data.postId || null, 
      data.authorId, 
      data.inputTitle || null, 
      data.inputContent, 
      data.toxicityScore || 0, 
      data.harassmentScore || 0, 
      data.verdict, 
      data.suggestion || null, 
      data.model || 'keyword-v1', 
      data.createdAt
    ),
    getAiReviewByPostId: async (postId) => first('SELECT * FROM ai_reviews WHERE post_id = ?', postId),
    listAiReviewsAdmin: async () =>
      all(
        `SELECT id, post_id as postId, author_id as authorId, input_title as inputTitle, input_content as inputContent,
                toxicity_score as toxicityScore, harassment_score as harassmentScore, verdict, suggestion, model, created_at as createdAt
         FROM ai_reviews
         ORDER BY created_at DESC
         LIMIT 200`,
      ),

    // Notifications
    listNotifications: async (userId) =>
      all(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        userId,
      ),
    insertNotification: async (data) =>
      run(
        'INSERT INTO notifications (id, user_id, type, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        data.id,
        data.userId,
        data.type,
        data.content,
        data.relatedId || null,
        data.createdAt,
      ),
    markNotificationAsRead: async (id) =>
      run('UPDATE notifications SET is_read = 1 WHERE id = ?', id),
  };
}
