# ☁️ Phase 3: 상용 배포 및 시스템 고도화 상세 계획

본 문서는 Phase 3(상용 배포 준비) 단계에서 수행해야 할 세부 작업과 기술적 고려사항을 정리합니다.

---

## 1. 데이터 레이어 (Database & Storage)

### 1.1 Cloudflare D1 전환
- [x] **마이그레이션 스크립트**: `DAGEOLGO_MASTER_GUIDE.md` 스키마를 기준으로 `npx wrangler d1 migrations create` 실행 및 SQL 작성. (완료)
- [x] **어댑터 완성**: `apps/worker-api/src/db/d1Adapter.mjs` 구현 및 로컬 테스트 완료. (완료)
- [x] **AI 리뷰 이력 저장**: `ai_reviews` 테이블을 추가하여 모든 AI 판정 결과를 영속화. (완료)

### 1.2 Cloudflare R2 전환
- [x] **R2 바인딩**: `wrangler.toml`에 R2 버킷 설정 추가. (코드 로직 반영 완료)
- [x] **파일 서빙**: 로컬 FS 기반 서빙을 R2 Public URL 또는 Worker Proxy 방식으로 변경. (완료)

---

## 2. AI 및 실시간 엔진 (Railway & Real-time)

### 2.1 AI Backend (FastAPI) 배포
- [x] **Dockerization**: Railway 배포를 위한 `Dockerfile` 최적화 및 멀티 스테이지 빌드 적용. (완료)
- [ ] **OpenAI 연동**: OpenAI API Key를 적용하고, LangGraph 기반의 문맥 분석 및 '선배 톤' 제안 기능 활성화.
- [ ] **헬스체크**: Railway 배포 후 `worker-api`와의 통신 상태 모니터링.

### 2.2 WebSocket 고도화
- [ ] **메시지 영속화**: 채팅 메시지를 `chat_msgs` 테이블에 저장하여 과거 대화 내역 조회 지원.
- [ ] **룸 관리**: 사용자 접속/퇴장 이벤트 정교화 및 동시 접속자 수 표시.

---

## 3. 프론트엔드 및 UX (UX Enhancement)

### 3.1 AI 중재 사용자 경험
- [ ] **AiReviewModal 연동**: 게시글/답글 작성 시 AI 판정 대기 및 결과(WARN/BLOCK) 노출 UX 완성.
- [ ] **낙관적 업데이트**: 좋아요 및 답글 작성 시 실시간 UI 반영 로직 강화.

### 3.2 성능 및 배포
- [ ] **Cloudflare Pages 배포**: `apps/web` 빌드 아티팩트 자동 배포 파이프라인 구축.
- [ ] **에러 바운더리**: 네트워크 장애 또는 API 오류 시 사용자 알림 및 복구 UI 구현.

---

## 4. 최종 보안 및 환경 설정 (Final Check)

- [ ] **환경 변수 생산화**: `BEFORE_DEPLOY.md`를 기반으로 실제 운영용 API 키 및 Secret 관리.
- [x] **보안 강화**: CORS 정책 제한 및 관리자 계정(RBAC) 접근 제어 확인. (완료)
- [ ] **도메인 연결**: 대학교 전용 서브도메인(예: `da.kyonggi.ac.kr`) 연결 및 SSL 인증.

---

**업데이트 일자**: 2026-05-15
**담당**: 프로젝트 리드

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
