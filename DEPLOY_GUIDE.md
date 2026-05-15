# 🚀 다걸고(Dageolgo) 배포 가이드 (Cloudflare & Railway)

다걸고 플랫폼의 프로덕션 배포 가이드입니다.

| 구성 요소 | 배포 대상 | 주요 기술 |
| :--- | :--- | :--- |
| **Frontend (web)** | **Cloudflare Pages** | React, Vite |
| **Worker API** | **Cloudflare Workers** | Node.js, D1, R2 |
| **AI Backend** | **Railway** | Python, FastAPI, Docker |

---

## 1. Backend (Worker API) 배포

### 1-1. D1 데이터베이스 생성 및 ID 설정
1. D1 데이터베이스가 이미 생성되었습니다!
   *   **Database Name**: `dageolgo-db`
   *   **Database ID**: `3b1797f3-efb6-4522-90f1-fa7fd9ffab01`
2. `apps/worker-api/wrangler.toml`에 이미 입력해 두었습니다.

### 1-2. 데이터베이스 마이그레이션 (완료)
이미 터미널에서 운영 DB로 마이그레이션을 완료했습니다.

### 1-3. Worker 배포
이제 아래 명령어를 실행하여 Worker를 배포하세요.
```bash
npx wrangler deploy
```

---

## 2. Frontend (Web) 배포 (Cloudflare Pages)

### 2-1. 프로젝트 연결
1. Cloudflare 대시보드 -> Workers & Pages -> **dageolgo-web** 프로젝트 선택
2. **Settings -> Builds & Deployments -> GitHub**에서 레포지토리 연결

### 2-2. 빌드 설정
*   **Framework preset**: `Vite`
*   **Build command**: `npm run build`
*   **Build output directory**: `dist`
*   **Root directory**: `apps/web`

### 2-3. 환경 변수 (Cloudflare Dash)
Pages 설정의 **Settings -> Variables and Secrets**에서 다음을 추가하세요.
*   `VITE_API_BASE_URL`: `https://worker-api.<your-subdomain>.workers.dev/api/v1`
*   `VITE_WS_BASE_URL`: `https://<your-railway-app-url>` (Railway 배포 후 획득)

---

## 3. AI Backend 배포 (Railway)

### 3-1. Railway 연결
1. [Railway](https://railway.app/) 대시보드에서 **New Project -> Deploy from GitHub repo** 선택
2. `da_community` 레포지토리 선택
3. **Settings -> Root Directory**를 `apps/ai-backend`로 설정 (Railway가 Dockerfile을 자동 감지합니다.)

### 3-2. 포트 설정
*   Railway는 기본적으로 `PORT` 환경 변수를 제공합니다. `Dockerfile`이 이를 사용하도록 이미 설정되어 있습니다 (8000포트).

---

## ⚠️ 프로덕션 체크리스트
1. **CORS**: `worker-api/server.mjs`는 요청의 `Origin`을 자동으로 허용하지만, 보안을 위해 Cloudflare Pages 도메인만 허용하도록 추후 고정하는 것을 권장합니다.
2. **Secrets**: JWT_SECRET 등 민감한 값은 `wrangler.toml`이 아닌 Cloudflare 대시보드의 **Settings -> Variables**에서 **Secret**으로 추가하세요.

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
