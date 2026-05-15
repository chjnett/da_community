# 🚀 Dageolgo Deployment Checklist (배포 전 확인 사항)

이 문서는 로컬 개발 환경에서 Cloudflare 실서비스(Production) 환경으로 전환하기 위해 필요한 필수 작업들을 정리한 체크리스트입니다.

---

## 1. 데이터베이스 (Cloudflare D1)
- [ ] **마이그레이션 파일 생성**: 로컬 SQLite(`dev.db`)의 최신 스키마(replies 테이블, likes_count 컬럼 등)를 포함하는 `migrations/0001_initial.sql` 파일 작성.
- [ ] **D1 DB 생성**: `npx wrangler d1 create dageolgo-db` 실행.
- [ ] **스키마 적용**: `npx wrangler d1 migrations apply dageolgo-db --remote` 명령으로 클라우드 DB 구조 구축.
- [ ] **초기 데이터**: 필수 게시판(자유게시판 등) 데이터 인서트 스크립트 실행.

## 2. 파일 스토리지 (Cloudflare R2)
- [ ] **R2 버킷 생성**: `npx wrangler r2 bucket create dageolgo-assets` 실행.
- [ ] **CORS 설정**: 브라우저 직접 업로드를 위해 버킷에 `cors.json` 설정 적용.
- [ ] **코드 전환**: `server.mjs`의 로컬 파일 저장 로직을 R2 바인딩 사용 로직으로 전환 (`env.ASSETS_BUCKET.put`).

## 3. 보안 및 인증 (Security)
- [ ] **비밀값 등록**: `JWT_SECRET`을 `npx wrangler secret put JWT_SECRET`으로 클라우드 환경에 등록.
- [ ] **테스트 코드 제거**: 
  - `RouteGuards.tsx`의 인증 우회(`true` 강제 리턴) 로직 제거.
  - `LoginPage.tsx`의 더미 로그인 버튼 및 자동 입력 로직 제거.
- [ ] **비밀번호 정책**: 배포 환경용 실제 bcrypt salt round 확인.

## 4. AI 백엔드 (FastAPI)
- [ ] **도커 호스팅**: FastAPI 서버를 외부 서버(AWS, Fly.io 등)에 배포 및 도메인 할당.
- [ ] **WebSocket 연동**: `ai-backend` 주소를 상용 주소로 변경하여 `worker-api` 및 `web` 앱의 환경변수 업데이트.

## 5. 환경 변수 (Environment Variables)
- [ ] **Frontend (`.env.production`)**:
  - `VITE_API_BASE_URL`: 배포된 Worker URL (예: `https://api.dageolgo.com`)
  - `VITE_WS_BASE_URL`: 배포된 AI Backend WS URL (예: `wss://ai.dageolgo.com`)
- [ ] **Worker API (`wrangler.toml`)**:
  - `AI_BACKEND_URL`: AI 서버의 실제 API 주소.
  - `ENVIRONMENT`: `production`으로 설정.

## 6. 최종 테스트 (Final E2E)
- [ ] 실제 대학 이메일(또는 모의 도메인)을 이용한 회원가입/인증 흐름 확인.
- [ ] AI 리뷰 차단 기능 및 실시간 채팅(WebSocket) 연결성 최종 확인.
- [ ] 모바일 환경(브라우저)에서 레이아웃 깨짐 현상 최종 점검.

---
**작성일**: 2026-05-14
**버전**: v1.0.0

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
