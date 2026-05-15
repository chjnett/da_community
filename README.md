# Dageolgo

실명 기반 대학 커뮤니티 프로젝트입니다.

## 개요
- Frontend: `apps/web` (React + Vite)
- API: `apps/worker-api` (Cloudflare Workers + D1 + R2)
- AI Backend: `apps/ai-backend` (FastAPI, Railway)

## 현재 상태 (2026-05-16)
- 인증 갱신: `POST /api/v1/auth/refresh` 지원
- 알림 API: `GET /api/v1/notifications` 안정화
- 프로필/통계: `/api/v1/auth/me`에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환
- AI 검토: 욕설뿐 아니라 비난/낙인성 표현까지 검토 강화
- 작성 UX: 경고/차단 시 `수정하기` / `그래도 올리기(forcePublish)` 선택 가능

## 빠른 시작
```bash
npm install
npm run dev
```

## 문서
- 실행 가이드: [RUN_GUIDE.md](./RUN_GUIDE.md)
- 배포 가이드: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- 배포 전 체크리스트: [BEFORE_DEPLOY.md](./BEFORE_DEPLOY.md)
- 트러블슈팅: [트러블 슈팅.md](./트러블%20슈팅.md)
- 전체 설계: [DAGEOLGO_MASTER_GUIDE.md](./DAGEOLGO_MASTER_GUIDE.md)
