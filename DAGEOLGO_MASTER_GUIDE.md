# [Master Guide] 다걸고(Dageolgo) 최종 구축 가이드

## 0. 문서 목적
- 이 문서는 "다걸고"를 실제로 출시 가능한 수준으로 구현하기 위한 단일 기준 문서다.
- 범위는 아키텍처, 데이터 모델, API 계약, 인프라, 보안, 운영, 테스트, 단계별 실행 계획까지 포함한다.
- 기준 버전: `v1.0`
- 기준 일자: `2026-05-14`

## 1. 제품 원칙(Product Principles)
- 실명 기반 책임 커뮤니티를 최우선으로 한다.
- 사용자의 글쓰기 흐름을 방해하지 않는 "부드러운 AI 중재"를 지향한다.
- 학과/학번은 수집하되 공개는 사용자 선택으로 보장한다.
- 초기 타겟은 경기대학교(`kyonggi.ac.kr`)이며, 멀티 대학 확장을 전제로 설계한다.

## 2. 아키텍처 결정(ADR 요약)
### 2.1 하이브리드 구조
- Frontend: Cloudflare Pages + React + Tailwind
- Edge/API Gateway: Cloudflare Workers
- Core AI/Business: Dockerized FastAPI (LangGraph)
- DB: Cloudflare D1
- Object Storage: Cloudflare R2
- Tunnel: Cloudflare Tunnel (FastAPI private origin 연결)

### 2.2 결정 이유
- Workers로 인증/라우팅/경량 로직을 처리해 지연시간을 최소화한다.
- LangGraph가 필요한 복합 AI 플로우는 FastAPI로 분리해 유지보수성과 관측성을 확보한다.
- D1/R2로 Cloudflare 생태계에 일원화해 운영 복잡도를 낮춘다.

## 3. 모노레포 구조 제안(Turborepo)
```txt
repo/
  apps/
    web/                  # React + Vite + Tailwind
    worker-api/           # Cloudflare Worker (auth/gateway/chat)
    ai-backend/           # FastAPI + LangGraph
  packages/
    ui/                   # 공용 UI 컴포넌트 (웹/앱 공유)
    core/                 # 타입, DTO, 유효성 스키마(zod)
    api-client/           # 공용 API SDK (fetch wrapper)
    config/               # eslint/tsconfig/shared constants
  infra/
    d1/
      migrations/         # SQL migration
      seeds/              # 초기 데이터
    docker/
      ai-backend.Dockerfile
    tunnel/
      cloudflared-config.yml
  docs/
    ADR/
    API/
  .github/workflows/
```

## 4. 도메인 모델 및 정책
### 4.1 사용자 정책
- 실명(`real_name`)은 필수이며 숨김/수정 불가.
- 학과(`dept`), 학번(`sid`)은 저장하되 공개 플래그(`is_dept_open`, `is_sid_open`)로 통제.
- 학교 도메인 기반 가입 제한: 초기 `kyonggi.ac.kr`만 허용.

### 4.2 게시글 정책
- 게시글은 반드시 `board_id`, `author_id`를 가진다.
- 이미지는 R2 오브젝트 키 배열을 `images_json`으로 보관한다.
- AI 중재 결과(점수/사유/제안)는 별도 테이블에 저장해 감사 가능하게 한다.

## 5. D1 스키마(초안 SQL)
```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                     -- ULID/UUID
  email TEXT NOT NULL UNIQUE,
  real_name TEXT NOT NULL,
  dept TEXT,
  sid TEXT,
  is_dept_open INTEGER NOT NULL DEFAULT 0,
  is_sid_open INTEGER NOT NULL DEFAULT 0,
  university_code TEXT NOT NULL DEFAULT 'KYONGGI',
  role TEXT NOT NULL DEFAULT 'USER',       -- USER, ADMIN
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- PUBLISHED, HIDDEN, DELETED
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(board_id) REFERENCES boards(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  board_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(board_id) REFERENCES boards(id)
);

CREATE TABLE IF NOT EXISTS chat_msgs (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY(sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  author_id TEXT NOT NULL,
  input_title TEXT,
  input_content TEXT NOT NULL,
  toxicity_score REAL NOT NULL DEFAULT 0,
  harassment_score REAL NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL,                    -- OK, SOFT_WARN, BLOCK
  suggestion TEXT,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_board_created ON posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_room_created ON chat_msgs(room_id, created_at DESC);
```

## 6. API 계약(Workers Gateway 기준)
### 6.1 인증
1. `POST /api/v1/auth/signup`
- 요청:
```json
{
  "email": "20231234@kyonggi.ac.kr",
  "realName": "홍길동",
  "dept": "컴퓨터공학부",
  "sid": "20231234",
  "password": "********"
}
```
- 검증:
  - `email`은 `@kyonggi.ac.kr` 필수
  - `realName` 빈값 불가
- 응답:
```json
{
  "userId": "01HX...",
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

2. `POST /api/v1/auth/login`
3. `POST /api/v1/auth/refresh`
4. `POST /api/v1/auth/logout`

### 6.2 게시글
1. `GET /api/v1/boards`
2. `GET /api/v1/boards/:slug/posts?cursor=...`
3. `POST /api/v1/posts`
4. `GET /api/v1/posts/:id`
5. `PATCH /api/v1/posts/:id`
6. `DELETE /api/v1/posts/:id`

### 6.3 AI 리뷰
1. `POST /api/v1/ai/review`
- 요청:
```json
{
  "title": "제목",
  "content": "본문 내용",
  "authorId": "01HX..."
}
```
- 응답:
```json
{
  "verdict": "SOFT_WARN",
  "scores": {
    "toxicity": 0.64,
    "harassment": 0.58
  },
  "suggestion": "OO아, 표현이 날카롭게 들릴 수 있어. 사실 중심으로 한 번만 다듬어볼까?",
  "requestId": "rvw_..."
}
```

### 6.4 에러 표준
- 포맷:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email domain is not allowed",
    "requestId": "req_..."
  }
}
```

## 7. AI 에이전트 상세 설계(LangGraph)
### 7.1 노드 구성
1. `InputNormalizeNode`
- title/content 길이 제한, 금칙어 사전 전처리
2. `RiskScoringNode`
- 공격성/조롱/비하 점수 계산
3. `PolicyJudgeNode`
- 기준:
  - `OK`: 모든 점수 < 0.35
  - `SOFT_WARN`: 0.35 이상 0.75 미만
  - `BLOCK`: 0.75 이상
4. `SeniorToneRewriteNode`
- `SOFT_WARN`, `BLOCK`에서만 제안문 생성

### 7.2 프롬프트 가드레일
- 페르소나: "친절하지만 단호한 대학 선배"
- 금지: 혐오/조롱/모욕 재생산, 정치/종교 분쟁 조장
- 원칙: 비난보다 개선 제안 우선, 2문장 이내, 존댓말 유지

## 8. 프론트엔드 구현 전략
### 8.1 핵심 화면
- 회원가입/로그인
- 게시판 목록/게시글 목록/상세/작성
- 실시간 라운지 채팅
- 프로필 공개범위 설정

### 8.2 작성 중 AI 피드백 훅
```ts
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useSeniorAdvice(title: string, content: string) {
  const [advice, setAdvice] = useState("");
  const [verdict, setVerdict] = useState<"OK" | "SOFT_WARN" | "BLOCK" | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content.trim().length < 10) return;
      const res = await api.post("/api/v1/ai/review", { title, content });
      setAdvice(res.data.suggestion ?? "");
      setVerdict(res.data.verdict ?? "OK");
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content]);

  return { advice, verdict };
}
```

### 8.3 UX 원칙
- 입력 중 경고는 툴팁/보조 텍스트로만 노출한다.
- `BLOCK` 판정 시에도 즉시 차단보다 "수정 후 재검토"를 우선 제공한다.
- 실명/학과/학번 노출 상태를 작성 화면에서 항상 확인 가능해야 한다.

## 9. Worker/FastAPI 경계
### 9.1 Workers 책임
- JWT 검증, 레이트리밋, 요청 스키마 검증
- D1 CRUD (가벼운 조회/쓰기)
- WebSocket 연결 관리 및 채팅 브로드캐스트
- FastAPI AI 엔드포인트 프록시

### 9.2 FastAPI 책임
- LangGraph 실행
- 외부 AI API 호출, fallback 처리
- AI 리뷰 로그 적재(Workers API or D1 direct adapter)

## 10. Docker/배포
### 10.1 FastAPI Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 10.2 환경변수 표준
```env
# 공통
APP_ENV=production

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=3600

# Cloudflare
D1_DATABASE_ID=...
R2_BUCKET=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# AI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
AI_REVIEW_TIMEOUT_MS=5000

# Gateway -> AI Backend
AI_BACKEND_BASE_URL=https://ai-backend.internal
```

### 10.3 릴리즈 파이프라인(권장)
1. PR 생성
2. CI: lint + typecheck + unit test
3. Preview 배포(Pages/Worker)
4. 스테이징 E2E
5. 프로덕션 승인 배포

## 11. 보안/컴플라이언스
- 실명 데이터는 최소 권한 원칙으로 접근 통제.
- 로그에 `real_name`, `sid` 평문 출력 금지.
- 비밀번호는 `argon2/bcrypt` 해시 저장.
- Rate Limit: 로그인/회원가입/AI 리뷰 엔드포인트 필수.
- 관리자 기능은 role 기반 접근 제어(RBAC).

## 12. 관측성(Observability)
- 공통 `requestId`를 Workers -> FastAPI까지 전달.
- 지표:
  - API latency p50/p95
  - AI 리뷰 성공률/타임아웃율
  - 게시글 작성 전환율
  - SOFT_WARN/BLOCK 비율
- 에러 알림: Sentry + Cloudflare 로그 기반 알림.

## 13. 테스트 전략
### 13.1 단위 테스트
- 유효성 검증(zod/pydantic)
- 정책 판정 함수(`OK/SOFT_WARN/BLOCK`)

### 13.2 통합 테스트
- Worker API + D1 CRUD
- FastAPI AI 리뷰 체인

### 13.3 E2E
- 회원가입 -> 게시글 작성 -> AI 경고 확인 -> 수정 게시
- 채팅방 입장/메시지 송수신

## 14. 단계별 실행 계획(구체화)
### Phase 1 (1~4주): 코어 출시 준비
1. 1주차
- 인증 플로우/도메인 검증 구현
- D1 1차 마이그레이션 적용(users, boards, posts)
2. 2주차
- 게시글 CRUD + 이미지 업로드(R2 presigned URL) 구현
3. 3주차
- 명찰 UI + 공개범위 설정 UI 연결
4. 4주차
- QA, 버그 수정, 스테이징 릴리즈

### Phase 2 (5~8주): AI/실시간 기능
1. 5주차
- FastAPI + LangGraph 기본 체인 구축
2. 6주차
- 작성 화면 AI 피드백 통합
3. 7주차
- WebSocket 라운지 채팅 + D1 저장
4. 8주차
- 관리자 게시판 관리 기능, 운영자 가이드 작성

### Phase 3 (9주~): 확장
1. Expo 앱 생성 및 공통 패키지 연결
2. 멀티 대학 코드/정책 확장
3. 월간 AI 커뮤니티 리포트 자동화

## 15. Definition of Done (릴리즈 기준)
- 인증, 게시글, AI 리뷰, 채팅이 모두 정상 동작한다.
- p95 API 지연시간 목표 충족(예: 800ms 이하, AI 제외).
- 주요 사용자 플로우 E2E 테스트 통과.
- 운영자 매뉴얼, 장애 대응 Runbook 문서화 완료.

## 16. 즉시 실행 체크리스트
- [ ] Turborepo 초기 구조 생성
- [ ] D1 마이그레이션 파일 작성/적용
- [ ] Worker API 기본 라우트 및 인증 미들웨어 구현
- [ ] FastAPI 서버/헬스체크/리뷰 API 구현
- [ ] R2 업로드 경로 및 MIME 검증 적용
- [ ] AI 리뷰 결과 저장(`ai_reviews`) 연결
- [ ] 스테이징 배포 + E2E 1차 통과

---

문서 소유자: `제품/개발 리드`
검토 주기: `주 1회`
