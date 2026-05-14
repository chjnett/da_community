# 🤖 AI Logic Developer Handover (AI 로직 개발자 인수인계)

## 1. 개요
본 서버(`apps/ai-backend`)는 Python FastAPI를 사용하여 게시글의 적절성을 검토(Review)하고, 실시간 실내/라운지 채팅(WebSocket)을 중계하는 역할을 합니다.

## 2. 핵심 엔드포인트
- **`POST /api/v1/ai/review`**:
  - `worker-api`로부터 텍스트를 전달받아 `OK/SOFT_WARN/BLOCK` 판정을 내립니다.
  - 현재는 `content_analyzer.py` 내의 키워드 스코어링 방식을 사용 중입니다.
- **`WS /ws/chat/{room_id}`**:
  - `ConnectionManager` 클래스가 방별 접속자를 관리하며 메시지를 브로드캐스팅합니다.
  - 메시지 규격: `{ type: "message.created", payload: { ... } }`

## 3. Worker API와의 협업
- `worker-api`는 게시글/답글 저장 전 반드시 이 서버의 `/ai/review`를 호출하여 승인(OK)을 받아야 합니다.
- 환경변수 `AI_BACKEND_URL`을 통해 통신합니다.

## 4. 고도화 방향 (Roadmap)
- [ ] **LangGraph 도입**: 단순 키워드 필터링을 넘어 문맥을 이해하는 복합 추론 엔진으로 업그레이드.
- [ ] **DB 영속화**: 현재 판단 결과를 DB에 저장하지 않음 -> `ai_reviews` 테이블에 로그 저장 로직 추가 필요.
- [ ] **감정 분석**: 사용자 통계에 활용할 수 있도록 텍스트의 감정(긍정/부정) 점수화 기능 추가.

## 5. 실행 환경
- **Python 3.10+** 필수.
- `requirements.txt`에 정의된 의존성 패키지 설치 필요.
- `app.main:app`을 통해 구동됩니다.
