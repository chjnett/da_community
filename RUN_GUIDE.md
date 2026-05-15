# 🛠️ Dageolgo Execution Guide (실행 가이드)

다게올고 플랫폼은 세 개의 서비스가 상호작용하는 3계층(3-Tier) 모노리포 아키텍처입니다.

---

## 1. 시스템 아키텍처 및 포트 구성

| 서비스 명 | 역할 | 기술 스택 | 실행 위치 | 포트 |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (web)** | 사용자 UI 및 클라이언트 로직 | React, Vite, TanStack Query | `apps/web` | `5173` |
| **Worker API** | DB 게이트웨이, 인증, 파일 업로드 | Node.js, SQLite (D1) | `apps/worker-api` | `8787` |
| **AI Backend** | AI 문장 리뷰, 중재 요청 처리 | Python, FastAPI | Docker 또는 `apps/ai-backend` | `8000` |

---

## 2. 통합 실행 방법 (추천)

프로젝트 루트(`da_community/`)에서 아래 명령어를 사용하여 전체 시스템을 구동합니다.

### 🚀 전체 구동 (Web + API)
AI 백엔드가 Docker로 실행 중일 때, 나머지 프론트엔드와 API만 띄우는 가장 권장되는 방법입니다.
```bash
npx turbo run dev --filter=web --filter=worker-api
```

---

## 3. 서비스별 구동 방법 (상세)

### Step 1: AI Backend 실행 (Docker 추천)
로컬 파이썬 환경(uvicorn) 문제 발생 시 Docker를 사용하세요.

**기존 컨테이너 시작:**
```bash
docker start dageolgo-ai
```

**새로 빌드 및 실행 (최초 1회 또는 코드 변경 시):**
```bash
cd apps/ai-backend
docker build -t dageolgo-ai .
docker run -d -p 8000:8000 --name dageolgo-ai dageolgo-ai
```

### Step 2: Worker API 및 Web 실행
```bash
# 루트 디렉토리에서
npx turbo run dev --filter=worker-api --filter=web
```

---

## 4. 트러블슈팅: 포트 점유 문제 해결 (Port Kill)

`EADDRINUSE: address already in use` 에러가 발생할 경우 아래 명령어로 기존 프로세스를 모두 종료하세요.

### 🧹 모든 포트 일괄 정리 (Mac/Linux)
```bash
lsof -ti :8787,8000,5173,5174,5175 | xargs kill -9
```

---

## 5. 주요 기능 가이드
- **게시판 추가**: 하단 네비게이션 '게시판' 탭 -> 상단 '게시판 추가' 탭에서 생성 가능.
- **실시간 피드**: 5초마다 자동으로 새로운 글을 불러오며, 글 작성 시 즉시 갱신됩니다.
- **AI 리뷰**: 게시글/답글 작성 시 AI 선배가 문장을 검토하며, 부적절한 언어 사용 시 등록이 제한될 수 있습니다.

---
**최종 업데이트**: 2026-05-15 (Antigravity)

---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
