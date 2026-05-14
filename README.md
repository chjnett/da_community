# 🎓 다걸고 (Dageolgo): 경기대학교 익명 커뮤니티 플랫폼

다걸고는 대학생들의 안전하고 따뜻한 소통을 위해 **AI 중재(Review)**와 **실시간 익명 채팅** 기술이 결합된 커뮤니티 플랫폼입니다.

---

## 🏛️ 서비스 아키텍처 (3-Tier)
본 프로젝트는 확장성과 유지보수 편의를 위해 세 개의 레이어로 분리되어 있습니다.

1.  **Frontend (`apps/web`)**: React 기반의 모바일 퍼스트 UI.
2.  **API Gateway (`apps/worker-api`)**: 서비스 비즈니스 로직, 인증, DB 관리 (Node.js).
3.  **AI Backend (`apps/ai-backend`)**: 실시간 채팅 및 AI 텍스트 분석 중재 (Python/FastAPI).

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 |
| :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS, React Query, Zustand |
| **Backend** | Node.js (Worker Runtime), SQLite/D1, R2 Storage |
| **AI/Real-time** | Python, FastAPI, WebSocket, LangGraph(준비중) |

---

## 🚀 빠른 시작 (Getting Started)
상세한 구동 방법은 [RUN_GUIDE.md](./RUN_GUIDE.md)를 참고하세요.

```bash
# 1. AI Backend 구동 (8000 포트)
cd apps/ai-backend && uvicorn app.main:app --port 8000

# 2. Worker API 구동 (8787 포트)
cd apps/worker-api && npm run dev

# 3. Frontend 구동 (5173 포트)
cd apps/web && npm run dev
```

---

## 📂 개발자 인수인계 문서
담당 파트별 상세 가이드는 아래 링크를 확인해 주세요.

*   **[프론트엔드 개발자 가이드](./HANDOVER_FRONTEND.md)**: UI 컴포넌트, 상태 관리, API 연동 규격
*   **[AI 로직 개발자 가이드](./HANDOVER_AI.md)**: AI 중재 엔진, WebSocket 통신, Python 백엔드 확장

---
**배포 전 필수 체크리스트**: [BEFORE_DEPLOY.md](./BEFORE_DEPLOY.md) 참고
