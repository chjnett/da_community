# Worker API (`apps/worker-api`)

## 역할
- 인증, 게시판/게시글/댓글 API
- D1 DB 접근
- R2 파일 업로드
- AI 백엔드 연동 게이트웨이

## 실행
```bash
npm install
npm run dev
```

## 배포
```bash
npx wrangler d1 migrations apply dageolgo-db --remote
npx wrangler deploy
```

## 주요 엔드포인트
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/notifications`
- `GET /api/v1/auth/stats`
- `GET /api/v1/stats/me` (레거시 호환)

## 운영 메모
- 알림 500 이슈: D1 어댑터 메서드 누락 및 notifications 테이블 미존재 문제 해결됨
- signup 500 이슈: `users.role` 컬럼 마이그레이션으로 해결됨
