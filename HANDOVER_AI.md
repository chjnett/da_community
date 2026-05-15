# 🤖 AI Logic Developer Handover (AI 로직 개발자 인수인계)

## 1. 개요
본 서버(`apps/ai-backend`)는 Python FastAPI와 **LangGraph**를 기반으로 하며, 커뮤니티 내 안전한 소통을 위한 **AI 콘텐츠 중재(Moderation)**와 **실시간 채팅(WebSocket)** 기능을 담당합니다.

## 2. AI 에이전트 설계 (LangGraph)
단순 필터링을 넘어 문맥을 이해하고 개선안을 제안하는 복합 추론 파이프라인을 구성합니다.

### 2.1 노드 구성 (Node Composition)
1.  **`InputNormalizeNode`**: 텍스트 정규화, 길이 제한 확인, 금칙어 사전 필터링.
2.  **`RiskScoringNode`**: LLM을 활용한 공격성/조롱/비하 점수(0.0 ~ 1.0) 계산.
3.  **`PolicyJudgeNode`**: 점수 기반 최종 판정.
    - `OK`: 모든 점수 < 0.35
    - `SOFT_WARN`: 0.35 ~ 0.75 (주의 및 수정 제안)
    - `BLOCK`: 0.75 이상 (게시 차단)
4.  **`SeniorToneRewriteNode`**: `SOFT_WARN` 이상인 경우, "친절한 선배" 톤으로 수정 제안문 생성.

### 2.2 페르소나 및 가드레일
- **페르소나**: "친절하지만 단호한 대학 선배"
- **원칙**: 비난보다는 개선 제안 우선, 존댓말 유지, 2문장 이내 요약.
- **금지**: 혐오 표현 재생산, 정치/종교 분쟁 유도.

## 3. WebSocket 프로토콜 (`/ws/chat/{room_id}`)
실시간 메시지 브로드캐스팅 규격입니다.
- **Client -> Server**: `{ "type": "message.create", "payload": { "content": "..." } }`
- **Server -> Client**: `{ "type": "message.created", "payload": { "id": "...", "content": "...", "senderId": "..." } }`

## 4. 인프라 및 배포 (Railway)
본 서버는 Docker화되어 **Railway** 환경에 배포됩니다.
- **Dockerfile**: `apps/ai-backend/Dockerfile` 참고 (Python 3.11-slim 기반).
- **환경 변수**: `OPENAI_API_KEY`, `APP_ENV`, `AI_REVIEW_TIMEOUT_MS` 등.
- **배포 명령**: `railway up`

## 5. 실행 환경 및 설정

### 5.1 환경 변수 설정 (.env)
서버 구동 전 반드시 `.env` 파일을 생성하고 필수 값을 설정해야 합니다.
```bash
cd apps/ai-backend
cp .env.example .env
```
- **주요 설정 항목**:
  - `OPENAI_API_KEY`: 고급 분석을 위한 OpenAI API 키 (필수 아님, 없을 시 Fallback 로직 작동).
  - `PORT`: 서버 포트 (기본: 8000).
  - `APP_ENV`: 실행 환경 (`development` 또는 `production`).

### 5.2 의존성 설치 및 실행
```bash
# 가상환경 구축 추천
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

## 6. 로직 테스트 가이드
```bash
cd apps/ai-backend
python test_review.py
```
- 이 스크립트는 `app/main.py`의 `_review_text` 함수를 직접 호출하여 다양한 케이스(OK, WARN, BLOCK)에 대해 판정 결과가 올바른지 확인합니다.

### 5.2 API 테스트 (Server Running)
서버가 구동 중인 상태에서 실제 엔드포인트를 호출하여 테스트합니다.
```bash
# 서버 실행 (8000 포트)
uvicorn app.main:app --reload --port 8000

# cURL 테스트
curl -X POST http://localhost:8000/api/v1/ai/review \
     -H "Content-Type: application/json" \
     -d '{"content": "이거 진짜 짜증나네요"}'
```

## 6. 백엔드/프론트엔드 연동 흐름
AI 로직이 시스템 전체에 어떻게 전달되는지 명시합니다.

1.  **AI -> Backend (Worker API)**:
    - `worker-api`의 `requestAiReview` 함수가 이 서버의 `/api/v1/ai/review`를 POST로 호출합니다.
    - 백엔드는 AI의 `verdict`를 받아 DB 저장 여부를 결정하며, 유효하지 않은 요청은 `422 Unprocessable Entity`를 반환합니다.
2.  **AI -> Frontend (Web)**:
    - 사용자가 글 작성 중 실시간 피드백을 받을 때 `useSeniorAdvice` 훅이 AI 서버에 직접 요청을 보냅니다.
    - WebSocket 연결 시 AI 서버는 `message.created` 이벤트를 통해 가공된 메시지 데이터를 프론트에 실시간 브로드캐스팅합니다.

## 7. 향후 고도화 과제 (Roadmap)
- [ ] **사용자 평판 시스템**: AI 판정 이력을 기반으로 사용자의 '커뮤니티 온도' 점수 산정.
- [ ] **멀티모달 검토**: 게시글 내 이미지의 유해성(R2 연동)까지 함께 검토하는 기능.
- [ ] **LangSmith 연동**: LLM 추론 과정의 관측성(Observability) 및 비용 추적 시스템 구축.

