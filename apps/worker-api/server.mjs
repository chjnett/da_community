import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSqliteAdapter } from './src/db/sqliteAdapter.mjs';
import { createD1Adapter } from './src/db/d1Adapter.mjs';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

loadDotEnv();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_change_me';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_change_me';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
const DB_DRIVER = process.env.DB_DRIVER || 'sqlite';

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const db = DB_DRIVER === 'd1'
  ? createD1Adapter(globalThis.DB)
  : createSqliteAdapter(process.cwd());
const dbPath = db.dbPath;

await seedIfEmpty();
await ensurePasswordHashes();

async function seedIfEmpty() {
  const boardCount = await db.countBoards();
  if (boardCount === 0) {
    await db.insertBoard(1, '자유게시판', 'free', '자유롭게 이야기해요', 'CAMPUS');
    await db.insertBoard(2, '새내기게시판', 'freshman', '새내기 전용', 'CAMPUS');
    await db.insertBoard(3, '취업/진로', 'career', '취업, 진로 고민', 'CAMPUS');
    await db.insertBoard(4, '라운지', 'lounge', '실시간 대화 라운지', 'LOUNGE');
  }

  const userCount = await db.countUsers();
  if (userCount === 0) {
    const now = new Date().toISOString();
    await db.createUser({
      id: 'usr_seed_001',
      email: '20230001@kyonggi.ac.kr',
      realName: '다걸고선배',
      dept: '컴퓨터공학부',
      sid: '20230001',
      password: 'password',
      isDeptOpen: 1,
      isSidOpen: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  const postCount = await db.countPosts();
  if (postCount === 0) {
    const now = Date.now();
    const seedPosts = [
      ['post_seed_1', 1, '중간고사 끝났네요', '다들 고생하셨습니다. 오늘은 푹 쉬어요.'],
      ['post_seed_2', 2, '수강신청 팁 공유', '전공 필수 먼저 잡고 교양은 나중에 넣는 걸 추천해요.'],
      ['post_seed_3', 3, '인턴 준비 어떻게 하시나요?', '포트폴리오와 자소서 중 어떤 걸 먼저 준비하면 좋을까요?'],
    ];

    for (let i = 0; i < seedPosts.length; i += 1) {
      const [id, boardId, title, content] = seedPosts[i];
      const t = new Date(now - i * 3600_000).toISOString();
      await db.createPost({ id, boardId, authorId: 'usr_seed_001', title, content, imagesJson: '[]', createdAt: t, updatedAt: t });
    }
  }
}

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  res.end(payload === undefined ? '' : JSON.stringify(payload));
}

function error(res, status, code, message, requestId) {
  json(res, status, { error: { code, message, requestId } });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * 아주 단순한 multipart/form-data 파서 (파일 1개 처리용)
 */
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return reject(new Error('No boundary found'));

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryStr = '--' + boundary;
      
      // 파일 내용 추출 (단순화된 방식: 첫 번째 파일만)
      const startIdx = buffer.indexOf('\r\n\r\n') + 4;
      const endIdx = buffer.lastIndexOf('\r\n' + boundaryStr);
      
      if (startIdx < 4 || endIdx <= startIdx) return reject(new Error('Invalid file data'));
      
      const fileBuffer = buffer.slice(startIdx, endIdx);
      
      // 파일명 추출 시도
      const headerStr = buffer.slice(0, startIdx).toString();
      const filenameMatch = headerStr.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `upload_${Date.now()}`;
      const ext = path.extname(filename) || '.jpg';
      
      resolve({ buffer: fileBuffer, filename, ext });
    });
    req.on('error', reject);
  });
}

function makeTokens(userId) {
  const nonce = crypto.randomUUID();
  return {
    accessToken: jwt.sign({ sub: userId, typ: 'access', jti: nonce }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }),
    refreshToken: jwt.sign({ sub: userId, typ: 'refresh', jti: nonce }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }),
  };
}

function verifyToken(token, secret, expectedType) {
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded !== 'object') return null;
    if (decoded.typ !== expectedType) return null;
    if (typeof decoded.sub !== 'string' || !decoded.sub) return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

async function readAuthUser(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const userId = verifyToken(auth.slice(7), ACCESS_TOKEN_SECRET, 'access');
  if (!userId) return null;
  return (await db.findUserById(userId)) || null;
}

async function ensurePasswordHashes() {
  const rows = await db.listUsersForHash();
  for (const row of rows) {
    if (typeof row.password !== 'string') continue;
    if (row.password.startsWith('$2a$') || row.password.startsWith('$2b$') || row.password.startsWith('$2y$')) continue;
    const hashed = bcrypt.hashSync(row.password, 10);
    await db.updateUserPassword(row.id, hashed, new Date().toISOString());
  }
}

function toProfile(userRow) {
  return {
    realName: userRow.real_name,
    university: userRow.university_code,
    dept: userRow.dept ?? undefined,
    sid: userRow.sid ?? undefined,
    isDeptOpen: Boolean(userRow.is_dept_open),
    isSidOpen: Boolean(userRow.is_sid_open),
  };
}

function toPostDetail(row) {
  return {
    id: row.id,
    boardId: String(row.board_id),
    title: row.title,
    content: row.content,
    images: safeParseJsonArray(row.images_json),
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      realName: row.real_name,
      dept: row.dept ?? undefined,
      sid: row.sid ?? undefined,
    },
  };
}

function toReplyDetail(row) {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      realName: row.real_name,
      dept: row.dept ?? undefined,
      sid: row.sid ?? undefined,
    },
  };
}

function safeParseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function aiReviewResult(content) {
  const text = String(content || '').toLowerCase();
  const hardWords = ['죽', '병신', '꺼져', '혐오', '멍청'];
  const softWords = ['짜증', '빡치', '화난', '극혐'];
  const hardHit = hardWords.some((w) => text.includes(w));
  const softHit = softWords.some((w) => text.includes(w));

  if (hardHit) {
    return {
      verdict: 'BLOCK',
      scores: { toxicity: 0.88, harassment: 0.84 },
      suggestion: '표현이 공격적으로 보일 수 있어요. 사실과 요청 중심으로 정중하게 다시 작성해 주세요.',
      requestId: `rvw_${crypto.randomUUID()}`,
    };
  }

  if (softHit) {
    return {
      verdict: 'SOFT_WARN',
      scores: { toxicity: 0.56, harassment: 0.49 },
      suggestion: '감정 표현을 조금만 완화하면 더 많은 공감을 얻을 수 있어요. 구체적인 상황을 덧붙여 볼까요?',
      requestId: `rvw_${crypto.randomUUID()}`,
    };
  }

  return {
    verdict: 'OK',
    scores: { toxicity: 0.08, harassment: 0.04 },
    suggestion: '',
    requestId: `rvw_${crypto.randomUUID()}`,
  };
}

async function requestAiReview(payload) {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/v1/ai/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const requestId = `req_${crypto.randomUUID()}`;
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const { pathname, searchParams } = url;

  // 모든 요청에 대한 간단한 로거 추가
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname} (${requestId})`);

  if (req.method === 'OPTIONS') {
    json(res, 204);
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/api/v1/health') {
      json(res, 200, { ok: true, service: 'worker-api', requestId, dbPath });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/signup') {
      const body = await parseBody(req);
      const { email, realName, dept, sid, password } = body;

      if (typeof email !== 'string' || !email.endsWith('@kyonggi.ac.kr')) {
        error(res, 400, 'VALIDATION_ERROR', 'email domain is not allowed', requestId);
        return;
      }
      if (typeof realName !== 'string' || !realName.trim()) {
        error(res, 400, 'VALIDATION_ERROR', 'realName is required', requestId);
        return;
      }
      if (typeof password !== 'string' || password.length < 4) {
        error(res, 400, 'VALIDATION_ERROR', 'password must be at least 4 characters', requestId);
        return;
      }
      if (await db.findUserByEmail(email)) {
        error(res, 409, 'CONFLICT', 'email already exists', requestId);
        return;
      }

      const userId = `usr_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.createUser({
        id: userId,
        email,
        realName,
        dept: typeof dept === 'string' ? dept : null,
        sid: typeof sid === 'string' ? sid : null,
        password: hashedPassword,
        isDeptOpen: 0,
        isSidOpen: 0,
        createdAt: now,
        updatedAt: now,
      });
      json(res, 200, { userId, ...makeTokens(userId) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/login') {
      const body = await parseBody(req);
      const user = await db.findUserByEmail(body.email);
      const isValid = user && typeof body.password === 'string' ? await bcrypt.compare(body.password, user.password) : false;
      if (!isValid) {
        error(res, 401, 'AUTH_INVALID', 'invalid credentials', requestId);
        return;
      }
      json(res, 200, { userId: user.id, ...makeTokens(user.id) });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/refresh') {
      const body = await parseBody(req);
      const userId = verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET, 'refresh');
      if (!userId || !(await db.findUserById(userId))) {
        error(res, 401, 'AUTH_INVALID', 'invalid refresh token', requestId);
        return;
      }
      json(res, 200, makeTokens(userId));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/logout') {
      json(res, 204);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/auth/me') {
      const user = await readAuthUser(req);
      if (!user) return error(res, 401, 'AUTH_REQUIRED', 'login required', requestId);
      json(res, 200, toProfile(user));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/auth/stats') {
      const user = await readAuthUser(req);
      if (!user) return error(res, 401, 'AUTH_REQUIRED', 'login required', requestId);
      const stats = await db.getUserStats(user.id);
      json(res, 200, stats);
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/v1/auth/me') {
      const user = await readAuthUser(req);
      if (!user) return error(res, 401, 'AUTH_REQUIRED', 'login required', requestId);
      const body = await parseBody(req);
      const isDeptOpen = body.isDeptOpen ? 1 : 0;
      const isSidOpen = body.isSidOpen ? 1 : 0;
      await db.updatePrivacy(user.id, isDeptOpen, isSidOpen, new Date().toISOString());
      const updated = await db.findUserById(user.id);
      json(res, 200, toProfile(updated));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/boards') {
      json(res, 200, await db.listBoards());
      return;
    }

    const boardPostsMatch = pathname.match(/^\/api\/v1\/boards\/([^/]+)\/posts$/);
    if (req.method === 'GET' && boardPostsMatch) {
      const slug = decodeURIComponent(boardPostsMatch[1]);
      const board = await db.getBoardBySlug(slug);
      if (!board) return error(res, 404, 'NOT_FOUND', 'board not found', requestId);

      const cursor = searchParams.get('cursor');
      const pageSize = 20;
      let offset = 0;

      if (cursor) {
        const ordered = await db.listPostIdsByBoard(board.id);
        const index = ordered.findIndex((r) => r.id === cursor);
        if (index >= 0) offset = index + 1;
      }

      const rows = await db.listPostsByBoard(board.id, pageSize, offset);
      const total = await db.countPostsByBoard(board.id);
      const nextCursor = offset + pageSize < total ? rows[rows.length - 1]?.id : undefined;

      const items = rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        likesCount: row.likes_count || 0,
        repliesCount: row.replies_count || 0,
        createdAt: row.created_at,
        author: {
          realName: row.real_name,
          dept: row.dept ?? undefined,
          sid: row.sid ?? undefined,
        },
      }));

      json(res, 200, { items, nextCursor });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/posts') {
      const user = (await readAuthUser(req)) || (await db.findUserById('usr_seed_001'));
      const body = await parseBody(req);
      if (typeof body.title !== 'string' || typeof body.content !== 'string') {
        return error(res, 400, 'VALIDATION_ERROR', 'title and content are required', requestId);
      }

      const boardId = Number(body.boardId);
      if (!(await db.hasBoardId(boardId))) return error(res, 400, 'VALIDATION_ERROR', 'invalid boardId', requestId);

      const postId = `post_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const images = Array.isArray(body.images) ? body.images : [];
      await db.createPost({ id: postId, boardId, authorId: user.id, title: body.title, content: body.content, imagesJson: JSON.stringify(images), createdAt: now, updatedAt: now });
      const created = await db.getPostById(postId);
      json(res, 200, toPostDetail(created));
      return;
    }

    // --- 답글(Replies) API ---
    const postRepliesMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)\/replies$/);
    
    if (postRepliesMatch && req.method === 'GET') {
      const postId = decodeURIComponent(postRepliesMatch[1]);
      if (!(await db.getPostById(postId))) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      const rows = await db.listReplies(postId);
      json(res, 200, rows.map(toReplyDetail));
      return;
    }

    if (postRepliesMatch && req.method === 'POST') {
      const postId = decodeURIComponent(postRepliesMatch[1]);
      if (!(await db.getPostById(postId))) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      
      const user = (await readAuthUser(req)) || (await db.findUserById('usr_seed_001'));
      const body = await parseBody(req);
      if (typeof body.content !== 'string' || !body.content.trim()) {
        return error(res, 400, 'VALIDATION_ERROR', 'content is required', requestId);
      }

      // AI 검토 (옵션)
      const aiResponse = await requestAiReview({ title: '답글', content: body.content, authorId: user.id });
      const verdict = aiResponse?.verdict ?? aiReviewResult(body.content).verdict;
      
      if (verdict === 'BLOCK') {
        return error(res, 422, 'AI_BLOCKED', 'content contains prohibited language', requestId);
      }

      const replyId = `rpl_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      await db.insertReply({ id: replyId, postId, authorId: user.id, content: body.content, createdAt: now });
      const created = await db.getReplyById(replyId);
      json(res, 200, toReplyDetail(created));
      return;
    }

    // --- 좋아요(Like) API (우선순위 높음) ---
    const likeMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)\/like$/);
    if (likeMatch && req.method === 'POST') {
      const postId = decodeURIComponent(likeMatch[1]);
      const post = await db.getPostById(postId);
      if (!post) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      
      await db.incrementLikes(postId);
      const updated = await db.getPostById(postId);
      json(res, 200, toPostDetail(updated));
      return;
    }

    // --- 게시글(Posts) API ---
    const postMatch = pathname.match(/^\/api\/v1\/posts\/([^/]+)$/);
    if (postMatch && req.method === 'GET') {
      const post = await db.getPostById(decodeURIComponent(postMatch[1]));
      if (!post) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      json(res, 200, toPostDetail(post));
      return;
    }

    if (postMatch && req.method === 'PATCH') {
      const postId = decodeURIComponent(postMatch[1]);
      const prev = await db.getPostById(postId);
      if (!prev) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      const body = await parseBody(req);
      const title = typeof body.title === 'string' ? body.title : prev.title;
      const content = typeof body.content === 'string' ? body.content : prev.content;
      const images = Array.isArray(body.images) ? body.images : safeParseJsonArray(prev.images_json);
      await db.updatePost(postId, title, content, JSON.stringify(images), new Date().toISOString());
      json(res, 200, toPostDetail(await db.getPostById(postId)));
      return;
    }

    if (postMatch && req.method === 'DELETE') {
      const postId = decodeURIComponent(postMatch[1]);
      const deleted = await db.deletePost(postId);
      if (!deleted.changes) return error(res, 404, 'NOT_FOUND', 'post not found', requestId);
      json(res, 204);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/ai/review') {
      const body = await parseBody(req);
      if (typeof body.content !== 'string') {
        return error(res, 400, 'VALIDATION_ERROR', 'content is required', requestId);
      }
      const aiResponse = await requestAiReview({
        title: typeof body.title === 'string' ? body.title : '',
        content: body.content,
        authorId: typeof body.authorId === 'string' ? body.authorId : undefined,
      });
      json(res, 200, aiResponse ?? aiReviewResult(body.content));
      return;
    }

    // 파일 업로드 (Local Dev)
    if (req.method === 'POST' && pathname === '/api/v1/files/upload') {
      try {
        const { buffer, ext } = await parseMultipart(req);
        const key = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(UPLOADS_DIR, key);
        fs.writeFileSync(filePath, buffer);
        
        json(res, 200, { 
          key, 
          url: `${req.headers.protocol || 'http'}://${req.headers.host}/api/v1/files/${key}` 
        });
      } catch (err) {
        error(res, 400, 'UPLOAD_ERROR', err.message, requestId);
      }
      return;
    }

    // 파일 서빙 (Local Dev)
    const fileMatch = pathname.match(/^\/api\/v1\/files\/([^/]+)$/);
    if (req.method === 'GET' && fileMatch) {
      const key = fileMatch[1];
      const filePath = path.join(UPLOADS_DIR, key);
      if (!fs.existsSync(filePath)) return error(res, 404, 'NOT_FOUND', 'file not found', requestId);
      
      const ext = path.extname(key).toLowerCase();
      const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/stats/me') {
      const user = await readAuthUser(req);
      if (!user) return error(res, 401, 'AUTH_REQUIRED', 'login required', requestId);
      const stats = await db.getUserStats(user.id);
      json(res, 200, stats);
      return;
    }

    error(res, 404, 'NOT_FOUND', 'route not found', requestId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    error(res, 500, 'INTERNAL_ERROR', message, requestId);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`worker-api listening on http://${HOST}:${PORT}`);
  console.log(`sqlite db: ${dbPath}`);
});
