# 🎓 다걸고 (Dageolgo) - Hybrid Cloud Community Platform

**다걸고**는 대학생들을 위한 실명 기반 책임 커뮤니티 플랫폼입니다. Cloudflare의 에지 컴퓨팅과 AI 중재 시스템을 결합하여 빠르고 안전한 소통 환경을 제공합니다.

---

## 🏗️ 시스템 아키텍처 (Hybrid Cloud)

- **Frontend**: [React] + [Vite] + [Tailwind] (Cloudflare Pages)
- **API Gateway**: [Cloudflare Workers] (Node.js)
- **Database**: [Cloudflare D1] (Serverless SQL)
- **Storage**: [Cloudflare R2] (Object Storage)
- **AI Backend**: [FastAPI] + [LangGraph] + [OpenAI] (Railway Docker Hosting)

---

## 📂 문서 가이드 (Documentation Index)

이 프로젝트의 세부 설계 및 운영 정보는 다음 문서들을 참조하세요.

### 1. 마스터 가이드 & 설계
- [**Master Guide**](./DAGEOLGO_MASTER_GUIDE.md): 제품 원칙, 데이터 모델, API 계약 등 전체 설계 기준
- [**Handover AI**](./HANDOVER_AI.md): AI 중재 로직 및 WebSocket 연동 상세
- [**Handover Frontend**](./HANDOVER_FRONTEND.md): 컴포넌트 구조 및 UI 설계 가이드

### 2. 설치 및 실행
- [**Run Guide**](./RUN_GUIDE.md): 로컬 개발 환경 구축 및 서비스 실행 방법
- [**Before Deploy**](./BEFORE_DEPLOY.md): 상용 배포 전 체크리스트 및 환경 변수 설정

### 3. 진행 상황
- [**TODO.md**](./TODO.md): 현재 구현 상태 및 단계별 로드맵 (Phase 1~4)
- [**Phase 3 Plan**](./PHASE3_PLAN.md): 상용 배포 준비 단계의 상세 실행 계획

---

## 🛠️ 모노레포 관리 (Turborepo)

이 프로젝트는 **Turborepo**를 사용하여 통합 관리됩니다.

```bash
# 전체 서비스 동시 실행 (Web + Worker + AI)
npm run dev

# 전체 프로젝트 빌드
npm run build

# 특정 앱만 실행 (예: AI 백엔드)
npx turbo run dev --filter=ai-backend
```

---

## 📝 주요 기능
- **실명 기반 소통**: 투명하고 책임감 있는 커뮤니티
- **AI '선배' 중재**: 무분별한 비난 대신 부드러운 수정을 제안하는 지능형 시스템
- **실시간 상호작용**: WebSocket 기반의 실시간 알림 및 채팅
- **에지 퍼포먼스**: Cloudflare 글로벌 네트워크를 통한 초고속 응답

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
