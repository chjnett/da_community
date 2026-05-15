# Web App (`apps/web`)

## 기술
- React + TypeScript + Vite
- TanStack Query
- Zustand

## 실행
```bash
npm install
npm run dev
```

## 환경변수
```bash
cp .env.example .env.local
```
- `VITE_API_BASE_URL` 예: `http://127.0.0.1:8787/api/v1`
- `VITE_WS_BASE_URL` 예: `http://127.0.0.1:8000`

## 인증 흐름
- 모든 API 호출은 `apiRequest` 사용
- 401 발생 시 `/auth/refresh` 호출로 토큰 재발급 시도
- 재발급 실패 시 세션 만료 처리

## 최근 반영
- 프로필 스키마 경고 대응 (`/auth/me` 응답 `id` 포함)
- `/stats/me` 경로 사용 코드와 백엔드 호환 정리
- AI 경고/차단 모달에서 `수정하기`/`그래도 올리기` 지원
