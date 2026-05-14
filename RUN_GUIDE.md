# 🛠️ Dageolgo Execution Guide (실행 가이드)

다게올고 플랫폼은 세 개의 독립적인 서비스가 상호작용하는 3계층(3-Tier) 아키텍처로 구성되어 있습니다.

---

## 1. 시스템 아키텍처 및 포트 구성

| 서비스 명 | 역할 | 기술 스택 | 실행 위치 | 포트 |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (web)** | 사용자 UI 및 클라이언트 로직 | React, Vite, Tailwind | `apps/web` | `5173` |
| **Worker API** | 인증, DB 게이트웨이, 파일 업로드 | Node.js, SQLite | `apps/worker-api` | `8787` |
| **AI Backend** | AI 리뷰, 실시간 채팅(WebSocket) | Python, FastAPI | `apps/ai-backend` | `8000` |

### 데이터 흐름 (Data Flow)
1.  **UI** → **Worker API(8787)**: 게시글 조회, 작성, 좋아요, 이미지 업로드.
2.  **UI** → **AI Backend(8000)**: 라운지 실시간 채팅 (WebSocket).
3.  **Worker API** ↔ **AI Backend**: 게시글/답글 작성 시 AI 자동 중재 및 스코어링 요청.

---

## 2. 서버별 구동 방법 (Step-by-Step)

모든 명령은 프로젝트 루트(`da_community/`)에서 실행한다고 가정합니다.

### Step 1: AI Backend 실행 (Python)
```bash
cd apps/ai-backend
source .venv/bin/activate  # 가상환경 활성화 (필요 시)
uvicorn app.main:app --reload --port 8000
```

### Step 2: Worker API 실행 (Gateway)
```bash
cd apps/worker-api
npm run dev  # 8787 포트에서 실행됨
```

### Step 3: Frontend 실행 (UI)
```bash
cd apps/web
npm run dev  # 5173 포트에서 실행됨
```

---

## 3. 포트 점유 문제 해결 (Port Kill)

서버를 종료했음에도 `Port already in use` 에러가 발생하거나 코드가 반영되지 않을 때 아래 명령어를 사용하세요.

### 특정 포트 강제 종료 (Mac/Linux)
- **Worker API (8787)**: `lsof -ti:8787 | xargs kill -9`
- **AI Backend (8000)**: `lsof -ti:8000 | xargs kill -9`
- **Frontend (5173)**: `lsof -ti:5173 | xargs kill -9`

### 전체 초기화 스크립트 (추천)
한 번에 모든 서버 포트를 정리하고 싶을 때 실행하세요:
```bash
kill -9 $(lsof -ti:8787,8000,5173)
```

---

## 4. 로컬 개발 시 유의사항
- **DB 초기화**: 스키마(컬럼) 변경 시 `apps/worker-api/data/dev.db`를 삭제하고 `worker-api`를 재시작하세요.
- **이미지 저장**: 업로드된 이미지는 `apps/worker-api/uploads/` 폴더에 물리적으로 저장됩니다.
- **WebSocket**: 채팅 서버는 반드시 FastAPI(`8000`)가 켜져 있어야 작동합니다.

---
**최종 업데이트**: 2026-05-14
