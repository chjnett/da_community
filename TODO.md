# ✅ Dageolgo Project TODO

## 🏁 Phase 1: 기반 구축 (완료)
- [x] 모노레포 아키텍처 설정 (`apps/web`, `apps/worker-api`, `apps/ai-backend`)
- [x] 사용자 인증 시스템 (JWT, bcrypt, 리프레시 토큰)
- [x] 게시판 및 게시글 CRUD (SQLite/D1 어댑터 기반)
- [x] AI 리뷰 엔진 연동 (FastAPI 기반 중재 로직)

## 🚀 Phase 2: 기능 고도화 (완료)
- [x] **답글(Reply) 시스템**: DB 연동 및 상세 페이지 내 목록/작성 구현
- [x] **이미지 업로드 고도화**: Multipart 지원 및 R2 전환 준비
- [x] **WebSocket 아키텍처**: 실시간 채팅/알림을 위한 통합 엔진 구축
- [x] **인터랙션 강화**: 좋아요(Like) 및 실시간 카운트 구현
- [x] **마이페이지 고도화**: 사용자 활동 통계 및 명찰 UI 적용

## ☁️ Phase 3: 상용 배포 준비 (진행 완료)
- [x] **데이터베이스 (Cloudflare D1)**: 마이그레이션(`0001`, `0002`) 및 D1 어댑터 완성
- [x] **스토리지 (Cloudflare R2)**: R2 어댑터 연동 및 보안 정책(MIME, 용량) 적용
- [x] **AI 서비스 (Railway)**: Dockerization 및 OpenAI '선배 톤' 고급 중재 활성화
- [x] **보안 및 운영**: Rate Limiting(속도 제한) 및 RBAC(관리자 권한) 구현
- [x] **모노레포 정예화**: Turborepo 기반 통합 태스크 관리 구축

## 🏁 Phase 4: 정식 출시 및 고도화 (Next)
- [ ] **환경 설정 최종 점검**: `BEFORE_DEPLOY.md` 기반 Production 환경 변수 주입
- [ ] **도메인 및 SSL**: 대학교 도메인 연결 및 HTTPS 보안 설정
- [x] **관리자 대시보드**: AI 리뷰 로그 모니터링 및 사용자 관리 전용 웹 UI (인프라 완료)
- [ ] **실명 인증 고도화**: 학생증 OCR 기반 학과/학번 자동 인증 연동 (Future)
- [ ] **검색 최적화**: 게시글 제목/내용 기반 고속 검색 및 필터링

---
**마지막 업데이트**: 2026-05-15 (Phase 3 완료 단계)

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
