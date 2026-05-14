# ✅ Dageolgo Project TODO

## 🏁 Phase 1: 기반 구축 (완료)
- [x] 모노레포 아키텍처 설정 (`apps/web`, `apps/worker-api`, `apps/ai-backend`)
- [x] 사용자 인증 시스템 (JWT, bcrypt, 리프레시 토큰)
- [x] 게시판 및 게시글 CRUD (SQLite/D1 어댑터 기반)
- [x] AI 리뷰 엔진 연동 (FastAPI 기반 중재 로직)

## 🚀 Phase 2: 기능 고도화 (진행 완료)
- [x] **답글(Reply) 시스템**: SQLite DB 연동 및 게시글 상세 내 답글 목록/작성 구현
- [x] **이미지 업로드 고도화**: Multipart 업로드 지원 및 로컬 서빙 (R2 전환 준비 완료)
- [x] **WebSocket 아키텍처 재편**: 실시간 채팅 로직을 `ai-backend`(FastAPI)로 이전 및 규격화
- [x] **인터랙션 강화**: 좋아요(Like) 기능 및 게시글/답글 수 실시간 카운트 구현
- [x] **마이페이지 고도화**: 사용자 활동 통계(글, 답글, 하트 수) 연동 및 명찰 UI 적용
- [x] **트러블슈팅 가이드**: 포트 충돌, 라우팅 우선순위 등 개발 중 발생 이슈 문서화

## ☁️ Phase 3: 상용 배포 준비 (Next Steps)
- [ ] **D1 마이그레이션**: 로컬 SQLite 데이터를 Cloudflare D1으로 이전할 SQL 스크립트 작성
- [ ] **R2 버킷 연동**: 로컬 `uploads/` 대신 실제 Cloudflare R2 스토리지 바인딩 적용
- [ ] **AI 백엔드 호스팅**: FastAPI 서버를 외부 도커 호스팅(Fly.io 등)에 배포
- [ ] **환경변수 생산화**: `BEFORE_DEPLOY.md` 체크리스트에 따라 Production 환경변수 세팅
- [ ] **최종 도메인 연결**: Cloudflare Pages 및 Workers에 대학교 서브도메인 연결

---
**마지막 업데이트**: 2026-05-14
