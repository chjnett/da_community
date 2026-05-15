# AI Backend (`apps/ai-backend`)

## 역할
- 텍스트 AI 검토 (`/api/v1/ai/review`)
- WebSocket 채팅 이벤트 브로드캐스팅

## 실행
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 환경변수
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `PORT`

## 확인
- `GET /health`
- `POST /api/v1/ai/review`

## 상태 메모
- fallback 규칙 강화(욕설 + 비난/낙인 표현)
- Railway 배포본이 최신 로직인지 별도 확인 필요
