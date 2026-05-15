# DEPLOY GUIDE

## 대상
- Web: Cloudflare Pages
- Worker API: Cloudflare Workers
- AI Backend: Railway

## 1) Worker API
```bash
cd apps/worker-api
npx wrangler d1 migrations apply dageolgo-db --remote
npx wrangler deploy
```

필수 확인:
- `/api/v1/auth/refresh` 동작
- `/api/v1/notifications` 동작
- `/api/v1/stats/me` 레거시 경로 동작

## 2) Web (Cloudflare Pages)
빌드 설정:
- Root: `apps/web`
- Build: `npm run build`
- Output: `dist`

환경변수:
- `VITE_API_BASE_URL=https://worker-api.<subdomain>.workers.dev/api/v1`
- `VITE_WS_BASE_URL=https://<railway-app-domain>`

## 3) AI Backend (Railway)
- Root Directory: `apps/ai-backend`
- `OPENAI_API_KEY` 설정
- 배포 후 확인:
  - `GET /health`
  - `POST /api/v1/ai/review`

참고:
- 현재 운영 점검에서 Railway는 응답 중.
- OpenAI 실사용 여부는 Railway 최신 코드/환경변수 배포 후 재검증 필요.
