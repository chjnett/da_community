import { Buffer } from 'node:buffer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSqliteAdapter } from './src/db/sqliteAdapter.mjs';
import { createD1Adapter } from './src/db/d1Adapter.mjs';
import { createR2Adapter } from './src/db/r2Adapter.mjs';

// --- Rate Limiter (In-Memory) ---
const rateLimits = new Map();
function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count++;
  }
  rateLimits.set(key, record);
  return record.count <= limit;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const db = env.DB ? createD1Adapter(env.DB) : createSqliteAdapter('.');
      const r2 = createR2Adapter(env);
      const config = {
        ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET || 'dev_access_secret_change_me',
        REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_change_me',
        ACCESS_TOKEN_EXPIRES_IN: env.ACCESS_TOKEN_EXPIRES_IN || '15m',
        REFRESH_TOKEN_EXPIRES_IN: env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        AI_BACKEND_URL: env.AI_BACKEND_URL || 'http://127.0.0.1:8000',
      };

      // Seed logic (Async)
      ctx.waitUntil((async () => {
        try {
          const boardCount = await db.countBoards();
          if (boardCount === 0) {
            await db.insertBoard(1, '자유게시판', 'free', '자유롭게 이야기해요', 'CAMPUS');
            await db.insertBoard(2, '새내기게시판', 'freshman', '새내기 전용', 'CAMPUS');
            await db.insertBoard(3, '취업/진로', 'career', '취업, 진로 고민', 'CAMPUS');
            await db.insertBoard(4, '라운지', 'lounge', '실시간 대화 라운지', 'LOUNGE');
          }
        } catch (e) {
          console.error('Seed error:', e);
        }
      })());

      return await handleRequest(request, env, db, r2, config);
    } catch (e) {
      console.error('Global Fetch Error:', e);
      // Fallback response if everything fails, ensuring CORS
      const origin = request.headers.get('Origin') || '*';
      return new Response(JSON.stringify({ error: { code: 'CRITICAL_ERROR', message: e.message } }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
  }
};

// --- Helpers ---
function json(data, status = 200, request = null) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  if (request) {
    const origin = request.headers.get('Origin');
    if (origin) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      headers.set('Access-Control-Allow-Origin', '*');
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  
  const body = (status === 204 || !data) ? null : JSON.stringify(data);
  return new Response(body, { status, headers });
}

function error(status, code, message, requestId = 'worker', request = null) {
  return json({ error: { code, message, requestId } }, status, request);
}

async function parseBody(request) {
  try { return await request.json(); } catch { return {}; }
}

async function parseMultipart(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) throw new Error('No file uploaded');
  const buffer = Buffer.from(await file.arrayBuffer());
  return { buffer, filename: file.name, mimetype: file.type };
}

function makeTokens(userId, config) {
  const nonce = crypto.randomUUID();
  return {
    accessToken: jwt.sign({ sub: userId, typ: 'access', jti: nonce }, config.ACCESS_TOKEN_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRES_IN }),
    refreshToken: jwt.sign({ sub: userId, typ: 'refresh', jti: nonce }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN }),
  };
}

function verifyToken(token, secret, expectedType) {
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.typ !== expectedType) return null;
    return decoded.sub;
  } catch { return null; }
}

async function getAuthUser(request, db, config) {
  let token = null;
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token) {
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      const cookies = Object.fromEntries(cookie.split(';').map(c => c.trim().split('=')));
      token = cookies.accessToken;
    }
  }
  if (!token) return null;
  const userId = verifyToken(token, config.ACCESS_TOKEN_SECRET, 'access');
  if (!userId) return null;
  return (await db.findUserById(userId)) || null;
}

function toProfile(userRow) {
  return {
    id: userRow.id,
    realName: userRow.real_name,
    university: userRow.university_code,
    dept: userRow.dept ?? undefined,
    sid: userRow.sid ?? undefined,
    isDeptOpen: Boolean(userRow.is_dept_open),
    isSidOpen: Boolean(userRow.is_sid_open),
    role: userRow.role,
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
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function aiReviewResult(content) {
  const text = String(content || '').toLowerCase().trim();
  const compact = text.replace(/[\s\W_]+/g, '');
  const blockPatterns = [/병\s*신/, /애\s*미/, /개\s*새\s*끼/, /ㅅㅂ/, /시\s*발/, /좆/, /죽\s*어/, /죽\s*여/, /꺼\s*져/, /자\s*살/, /강\s*간/, /능\s*욕/, /인\s*종\s*차\s*별/];
  const warnPatterns = [/짜\s*증/, /빡\s*치/, /극\s*혐/, /역\s*겨/, /한\s*심/, /열\s*받/, /존\s*나/, /멍\s*청/, /바\s*보/, /저\s*능/, /혐\s*오/];
  const blamePatterns = [/너(는|가)\s*문제/, /니가\s*문제/, /네가\s*문제/, /문제\s*있는\s*사람/, /인성\s*문제/, /수준\s*떨어/, /답\s*없/, /정신\s*차려/, /한심(하다|한\s*사람)/, /원래\s*그런\s*사람/, /같은\s*부류/, /최악/, /항상\s*그\s*모양/, /다\s*문제/, /전부\s*문제/, /쟤네는\s*원래/];
  const hasPattern = (p, s) => p.some((r) => r.test(s));
  const blockHit = hasPattern(blockPatterns, text) || hasPattern(blockPatterns, compact);
  const warnHit = hasPattern(warnPatterns, text) || hasPattern(warnPatterns, compact);
  const blameHit = hasPattern(blamePatterns, text) || hasPattern(blamePatterns, compact);
  if (blockHit) {
    return { verdict: 'BLOCK', scores: { toxicity: 0.9, harassment: 0.88 }, suggestion: '표현이 공격적으로 보일 수 있어요. 사실 중심으로 정중하게 수정해 주세요.', requestId: `rvw_${crypto.randomUUID()}`, source: 'worker:rule-v2' };
  }
  if (warnHit || blameHit) {
    return { verdict: 'SOFT_WARN', scores: { toxicity: blameHit ? 0.66 : 0.62, harassment: blameHit ? 0.62 : 0.55 }, suggestion: '상대를 평가하는 표현보다 상황/사실 중심으로 쓰면 더 잘 전달돼요. 표현을 한 번만 다듬어볼까요?', requestId: `rvw_${crypto.randomUUID()}`, source: 'worker:rule-v2' };
  }
  return { verdict: 'OK', scores: { toxicity: 0.08, harassment: 0.04 }, suggestion: '', requestId: `rvw_${crypto.randomUUID()}`, source: 'worker:rule-v2' };
}

async function requestAiReview(payload, config) {
  try {
    const response = await fetch(`${config.AI_BACKEND_URL}/api/v1/ai/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}

function isValidAiReview(review) {
  if (!review || typeof review !== 'object') return false;
  return ['OK', 'SOFT_WARN', 'BLOCK'].includes(review.verdict);
}

function makeFallbackReview(reason) {
  return {
    verdict: 'SOFT_WARN',
    scores: { toxicity: 0, harassment: 0 },
    suggestion: reason || 'AI review unavailable',
    requestId: `rvw_${crypto.randomUUID()}`,
    source: 'worker:fallback-unavailable',
  };
}

async function handleRequest(request, env, db, r2, config) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const searchParams = url.searchParams;
  const requestId = `req_${crypto.randomUUID()}`;

  if (method === 'OPTIONS') return json({ ok: true }, 204, request);

  try {
    const user = await getAuthUser(request, db, config);

    if (method === 'GET' && (path === '/api/v1/health' || path === '/api/v1/health/')) {
      return json({ ok: true, service: 'worker-api', requestId }, 200, request);
    }

    if (method === 'POST' && path === '/api/v1/auth/signup') {
      const body = await parseBody(request);
      const { email, realName, dept, sid, password } = body;
      if (!email || !email.endsWith('@kyonggi.ac.kr')) return error(400, 'VALIDATION_ERROR', 'Invalid email domain', requestId, request);
      if (!realName?.trim() || !password || password.length < 4) return error(400, 'VALIDATION_ERROR', 'Invalid input', requestId, request);
      if (await db.findUserByEmail(email)) return error(409, 'CONFLICT', 'Email exists', requestId, request);

      const userId = `usr_${crypto.randomUUID()}`;
      const hashedPassword = bcrypt.hashSync(password, 10);
      const now = new Date().toISOString();
      await db.createUser({ id: userId, email, realName, dept: dept || null, sid: sid || null, password: hashedPassword, role: 'ADMIN', isDeptOpen: 1, isSidOpen: 0, createdAt: now, updatedAt: now });
      
      const tokens = makeTokens(userId, config);
      const response = json({ userId, ...tokens }, 201, request);
      response.headers.append('Set-Cookie', `accessToken=${tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
      response.headers.append('Set-Cookie', `refreshToken=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
      return response;
    }

    if (method === 'POST' && (path === '/api/v1/auth/login' || path === '/api/v1/auth/login/')) {
      const body = await parseBody(request);
      if (!body.email || !body.password) return error(400, 'VALIDATION_ERROR', 'Email and password required', requestId, request);
      const userFound = await db.findUserByEmail(body.email);
      if (!userFound || !userFound.password || !bcrypt.compareSync(body.password, userFound.password)) {
        return error(401, 'AUTH_INVALID', 'Invalid credentials', requestId, request);
      }
      const tokens = makeTokens(userFound.id, config);
      const response = json({ userId: userFound.id, ...tokens }, 200, request);
      response.headers.append('Set-Cookie', `accessToken=${tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
      response.headers.append('Set-Cookie', `refreshToken=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
      return response;
    }

    if (method === 'POST' && (path === '/api/v1/auth/refresh' || path === '/api/v1/auth/refresh/')) {
      const body = await parseBody(request);
      let refreshToken = body?.refreshToken;
      if (!refreshToken) {
        const cookie = request.headers.get('Cookie');
        if (cookie) {
          const cookies = Object.fromEntries(cookie.split(';').map(c => c.trim().split('=')));
          refreshToken = cookies.refreshToken;
        }
      }
      if (!refreshToken) return error(401, 'AUTH_REQUIRED', 'Refresh token required', requestId, request);
      const userId = verifyToken(refreshToken, config.REFRESH_TOKEN_SECRET, 'refresh');
      if (!userId) return error(401, 'AUTH_INVALID', 'Invalid refresh token', requestId, request);
      const userFound = await db.findUserById(userId);
      if (!userFound) return error(401, 'AUTH_INVALID', 'User not found', requestId, request);

      const tokens = makeTokens(userFound.id, config);
      const response = json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, 200, request);
      response.headers.append('Set-Cookie', `accessToken=${tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
      response.headers.append('Set-Cookie', `refreshToken=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
      return response;
    }

    if (method === 'POST' && path === '/api/v1/auth/logout') {
      const response = json({ success: true }, 200, request);
      response.headers.append('Set-Cookie', 'accessToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      response.headers.append('Set-Cookie', 'refreshToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return response;
    }

    if (method === 'GET' && path === '/api/v1/auth/me') {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      return json(toProfile(user), 200, request);
    }

    if (method === 'GET' && path === '/api/v1/auth/stats') {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      return json(await db.getUserStats(user.id), 200, request);
    }

    // Backward compatibility: legacy profile stats path
    if (method === 'GET' && (path === '/api/v1/stats/me' || path === '/api/v1/stats/me/')) {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      return json(await db.getUserStats(user.id), 200, request);
    }

    if (method === 'PATCH' && path === '/api/v1/auth/me') {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      const body = await parseBody(request);
      const isDeptOpen = body.isDeptOpen !== undefined ? (body.isDeptOpen ? 1 : 0) : user.is_dept_open;
      const isSidOpen = body.isSidOpen !== undefined ? (body.isSidOpen ? 1 : 0) : user.is_sid_open;
      await db.updatePrivacy(user.id, isDeptOpen, isSidOpen, new Date().toISOString());
      return json(toProfile(await db.findUserById(user.id)), 200, request);
    }

    if (method === 'GET' && path === '/api/v1/boards') {
      return json(await db.listBoards(), 200, request);
    }

    if (method === 'POST' && path === '/api/v1/boards') {
      if (!user || user.role !== 'ADMIN') return error(403, 'FORBIDDEN', 'Admin required', requestId, request);
      const body = await parseBody(request);
      const { name, slug, description, category = 'CAMPUS' } = body;
      if (!name || !slug) return error(400, 'VALIDATION_ERROR', 'Name and slug required', requestId, request);
      if (await db.getBoardBySlug(slug)) return error(409, 'CONFLICT', 'Slug exists', requestId, request);
      const newId = (await db.countBoards()) + 1;
      await db.insertBoard(newId, name, slug, description || '', category);
      return json((await db.listBoards()).find(b => b.slug === slug), 201, request);
    }

    const bPostsMatch = path.match(/^\/api\/v1\/boards\/([^/]+)\/posts$/);
    if (method === 'GET' && bPostsMatch) {
      const slug = decodeURIComponent(bPostsMatch[1]);
      const board = await db.getBoardBySlug(slug);
      if (!board) return error(404, 'NOT_FOUND', 'Board not found', requestId, request);
      const cursor = searchParams.get('cursor');
      const pageSize = 20;
      let offset = 0;
      if (cursor) {
        const ids = await db.listPostIdsByBoard(board.id);
        const idx = ids.findIndex(r => r.id === cursor);
        if (idx >= 0) offset = idx + 1;
      }
      const rows = await db.listPostsByBoard(board.id, pageSize, offset);
      const total = await db.countPostsByBoard(board.id);
      const nextCursor = offset + pageSize < total ? rows[rows.length - 1]?.id : undefined;
      return json({ items: rows.map(toPostDetail), nextCursor, total }, 200, request);
    }

    if (method === 'POST' && (path === '/api/v1/posts' || path === '/api/v1/posts/')) {
      const activeUser = user || (await db.findUserById('usr_seed_001'));
      if (!checkRateLimit(`post_${activeUser.id}`, 5)) return error(429, 'RATE_LIMIT', 'Too many posts', requestId, request);
      const body = await parseBody(request);
      const forcePublish = Boolean(body.forcePublish);
      if (!body.title || !body.content || !body.boardId) return error(400, 'VALIDATION_ERROR', 'Missing fields', requestId, request);
      if (!(await db.hasBoardId(Number(body.boardId)))) return error(400, 'INVALID_BOARD', 'Board not found', requestId, request);
      let review = await requestAiReview({ title: body.title, content: body.content, authorId: activeUser.id }, config);
      if (!isValidAiReview(review) && !forcePublish) {
        return error(503, 'AI_REVIEW_UNAVAILABLE', 'AI review service unavailable', requestId, request);
      }
      if (!isValidAiReview(review) && forcePublish) {
        review = makeFallbackReview('Force-published while AI review unavailable');
      }
      if (review.verdict === 'BLOCK' && !forcePublish) return error(422, 'AI_BLOCKED', 'Inappropriate content', requestId, request);
      const postId = `post_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      await db.createPost({ id: postId, boardId: Number(body.boardId), authorId: activeUser.id, title: body.title, content: body.content, imagesJson: JSON.stringify(body.images || []), createdAt: now, updatedAt: now });
      await db.insertAiReview({ id: `rvw_${crypto.randomUUID()}`, postId, authorId: activeUser.id, inputTitle: body.title, inputContent: body.content, toxicityScore: review.scores?.toxicity, harassmentScore: review.scores?.harassment, verdict: review.verdict, suggestion: review.suggestion, model: review.source || 'keyword-v1', createdAt: now });
      return json(toPostDetail(await db.getPostById(postId)), 200, request);
    }

    const pRepliesMatch = path.match(/^\/api\/v1\/posts\/([^/]+)\/replies$/);
    if (pRepliesMatch && method === 'GET') {
      const postId = decodeURIComponent(pRepliesMatch[1]);
      if (!(await db.getPostById(postId))) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      return json((await db.listReplies(postId)).map(toReplyDetail), 200, request);
    }

    if (pRepliesMatch && method === 'POST') {
      const postId = decodeURIComponent(pRepliesMatch[1]);
      if (!(await db.getPostById(postId))) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      const activeUser = user || (await db.findUserById('usr_seed_001'));
      if (!checkRateLimit(`reply_${activeUser.id}`, 10)) return error(429, 'RATE_LIMIT', 'Too many replies', requestId, request);
      const body = await parseBody(request);
      const forcePublish = Boolean(body.forcePublish);
      if (!body.content?.trim()) return error(400, 'VALIDATION_ERROR', 'Content required', requestId, request);
      let review = await requestAiReview({ title: 'Reply', content: body.content, authorId: activeUser.id }, config);
      if (!isValidAiReview(review) && !forcePublish) {
        return error(503, 'AI_REVIEW_UNAVAILABLE', 'AI review service unavailable', requestId, request);
      }
      if (!isValidAiReview(review) && forcePublish) {
        review = makeFallbackReview('Force-published reply while AI review unavailable');
      }
      if (review.verdict === 'BLOCK' && !forcePublish) return error(422, 'AI_BLOCKED', 'Inappropriate content', requestId, request);
      const replyId = `rpl_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      await db.insertReply({ id: replyId, postId, authorId: activeUser.id, content: body.content, createdAt: now });
      const post = await db.getPostById(postId);
      if (post && post.author_id !== activeUser.id) {
        await db.insertNotification({ id: `ntf_${crypto.randomUUID()}`, userId: post.author_id, type: 'REPLY', content: `내 글에 댓글이 달렸습니다: ${body.content.slice(0, 20)}`, relatedId: postId, createdAt: now });
      }
      return json(toReplyDetail(await db.getReplyById(replyId)), 200, request);
    }

    const likeMatch = path.match(/^\/api\/v1\/posts\/([^/]+)\/like$/);
    if (likeMatch && method === 'POST') {
      const postId = decodeURIComponent(likeMatch[1]);
      if (!(await db.getPostById(postId))) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      await db.incrementLikes(postId);
      return json(toPostDetail(await db.getPostById(postId)), 200, request);
    }

    const pMatch = path.match(/^\/api\/v1\/posts\/([^/]+)$/);
    if (pMatch && method === 'GET') {
      const post = await db.getPostById(decodeURIComponent(pMatch[1]));
      if (!post) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      return json(toPostDetail(post), 200, request);
    }

    if (pMatch && method === 'PATCH') {
      const postId = decodeURIComponent(pMatch[1]);
      const prev = await db.getPostById(postId);
      if (!prev) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      const activeUser = user || (await db.findUserById('usr_seed_001'));
      if (activeUser.id !== prev.author_id && activeUser.role !== 'ADMIN') return error(403, 'FORBIDDEN', 'Not authorized', requestId, request);
      const body = await parseBody(request);
      await db.updatePost(postId, body.title || prev.title, body.content || prev.content, JSON.stringify(body.images || safeParseJsonArray(prev.images_json)), new Date().toISOString());
      return json(toPostDetail(await db.getPostById(postId)), 200, request);
    }

    if (pMatch && method === 'DELETE') {
      const postId = decodeURIComponent(pMatch[1]);
      const post = await db.getPostById(postId);
      if (!post) return error(404, 'NOT_FOUND', 'Post not found', requestId, request);
      if (!user || (user.id !== post.author_id && user.role !== 'ADMIN')) return error(403, 'FORBIDDEN', 'Not authorized', requestId, request);
      await db.deletePost(postId);
      return json(null, 204, request);
    }

    if (method === 'POST' && (path === '/api/v1/ai/review' || path === '/api/v1/ai/review/')) {
      const body = await parseBody(request);
      if (!body.content) return error(400, 'VALIDATION_ERROR', 'Content required', requestId, request);
      const result = aiReviewResult(body.content);
      if (body.authorId) {
      await db.insertAiReview({ id: `rvw_${crypto.randomUUID()}`, postId: null, authorId: body.authorId, inputTitle: body.title || null, inputContent: body.content, toxicityScore: result.scores?.toxicity, harassmentScore: result.scores?.harassment, verdict: result.verdict, suggestion: result.suggestion, model: result.source || 'worker:rule-v2', createdAt: new Date().toISOString() });
      }
      return json(result, 200, request);
    }

    if (method === 'POST' && path === '/api/v1/files/upload') {
      try {
        const { buffer, filename, mimetype } = await parseMultipart(request);
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimetype)) return error(400, 'INVALID_TYPE', 'Only images allowed', requestId, request);
        const key = `${crypto.randomUUID()}_${filename}`;
        await r2.upload(key, buffer, mimetype);
        return json({ key, url: r2.getPublicUrl(key) }, 200, request);
      } catch (e) { return error(400, 'UPLOAD_ERROR', e.message, requestId, request); }
    }

    if (method === 'GET' && path.startsWith('/api/v1/notifications')) {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      return json(await db.listNotifications(user.id), 200, request);
    }

    const ntfRead = path.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/);
    if (method === 'POST' && ntfRead) {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      await db.markNotificationAsRead(ntfRead[1]);
      return json(null, 204, request);
    }

    if (method === 'GET' && path === '/api/v1/stats/report') {
      if (!user) return error(401, 'AUTH_REQUIRED', 'Login required', requestId, request);
      const stats = await db.getUserStats(user.id);
      const report = { month: new Date().getMonth() + 1, summary: stats.temperature >= 36.5 ? '매우 따뜻해요' : '조금 더 노력이 필요해요', keywords: stats.temperature >= 36.5 ? ['#친절한', '#경청하는'] : ['#솔직한', '#직설적인'] };
      return json(report, 200, request);
    }

    if (path.startsWith('/api/v1/admin')) {
      if (!user || user.role !== 'ADMIN') return error(403, 'FORBIDDEN', 'Admin required', requestId, request);
      if (method === 'GET' && path === '/api/v1/admin/users') return json(await db.listAllUsers(), 200, request);
      if (method === 'PATCH' && path.startsWith('/api/v1/admin/users/')) {
        const targetId = path.split('/')[5];
        await db.updateUserAdmin(targetId, await parseBody(request));
        return json(null, 204, request);
      }
      if (method === 'DELETE' && path.startsWith('/api/v1/admin/users/')) {
        const targetId = path.split('/')[5];
        if (targetId === user.id) return error(400, 'BAD_REQUEST', 'Cannot delete self', requestId, request);
        await db.deleteUser(targetId);
        return json(null, 204, request);
      }
      if (method === 'GET' && path === '/api/v1/admin/posts') return json(await db.listAllPostsAdmin(), 200, request);
      if (method === 'GET' && path === '/api/v1/admin/replies') return json(await db.listAllRepliesAdmin(), 200, request);
      if (method === 'GET' && path === '/api/v1/admin/ai-logs') return json(await db.listAiReviewsAdmin(), 200, request);
      if (method === 'DELETE' && path.startsWith('/api/v1/admin/replies/')) {
        await db.deleteReply(path.split('/')[5]);
        return json(null, 204, request);
      }
    }

    return error(404, 'NOT_FOUND', `Route not found: ${path}`, requestId, request);
  } catch (err) { return error(500, 'INTERNAL_ERROR', err.message, requestId, request); }
}
