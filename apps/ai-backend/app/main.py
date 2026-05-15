import os
from uuid import uuid4
from datetime import datetime
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title='dageolgo-ai-backend', version='0.1.0')

# OpenAI 설정 (환경변수 기반)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- Models ---
class AiReviewRequest(BaseModel):
    title: str = Field(default='')
    content: str = Field(min_length=1)
    authorId: str | None = None

class AiScores(BaseModel):
    toxicity: float
    harassment: float

class AiReviewResponse(BaseModel):
    verdict: str
    scores: AiScores
    suggestion: str
    requestId: str

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # room_id별 활성 연결 관리
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # 연결이 끊긴 경우 등 예외 처리
                    pass

manager = ConnectionManager()

# --- Logic ---
def _review_text(content: str) -> AiReviewResponse:
    # 1. OpenAI API Key가 있는 경우 고급 분석 수행 (구조만 구현)
    if OPENAI_API_KEY:
        # TODO: 실제 OpenAI SDK를 사용한 LangGraph/LLM 로직 호출
        # 예: result = run_langgraph_review(content)
        pass

    # 2. 기본 키워드 스코어링 방식 (Fallback)
    text = content.lower()
    hard_words = ['죽', '병신', '꺼져', '혐오', '멍청']
    soft_words = ['짜증', '빡치', '화난', '극혐']

    hard_hit = any(w in text for w in hard_words)
    soft_hit = any(w in text for w in soft_words)

    if hard_hit:
        return AiReviewResponse(
            verdict='BLOCK',
            scores=AiScores(toxicity=0.88, harassment=0.84),
            suggestion='표현이 공격적으로 보일 수 있어요. 사실과 요청 중심으로 정중하게 다시 작성해 주세요.',
            requestId=f'rvw_{uuid4()}',
        )

    if soft_hit:
        return AiReviewResponse(
            verdict='SOFT_WARN',
            scores=AiScores(toxicity=0.56, harassment=0.49),
            suggestion='감정 표현을 조금만 완화하면 더 많은 공감을 얻을 수 있어요. 구체적인 상황을 덧붙여 볼까요?',
            requestId=f'rvw_{uuid4()}',
        )

    return AiReviewResponse(
        verdict='OK',
        scores=AiScores(toxicity=0.08, harassment=0.04),
        suggestion='',
        requestId=f'rvw_{uuid4()}',
    )

# --- Routes ---
@app.get('/health')
def health() -> dict[str, bool | str]:
    return {'ok': True, 'service': 'ai-backend'}

@app.post('/api/v1/ai/review', response_model=AiReviewResponse)
def review(payload: AiReviewRequest) -> AiReviewResponse:
    return _review_text(payload.content)

# --- WebSocket Endpoint ---
@app.websocket("/ws/chat/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            # 규격화된 메시지 수신: { type, payload }
            data = await websocket.receive_json()
            
            if data.get("type") == "message.create":
                payload = data.get("payload", {})
                
                # 메시지 생성 및 브로드캐스팅 규격
                outgoing = {
                    "type": "message.created",
                    "payload": {
                        "id": f"msg_{uuid4()}",
                        "roomId": room_id,
                        "senderId": "usr_unknown", # 실 구현 시 토큰 검증 필요
                        "content": payload.get("content", ""),
                        "createdAt": datetime.utcnow().isoformat() + "Z",
                        "clientMessageId": payload.get("clientMessageId")
                    }
                }
                await manager.broadcast(outgoing, room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, room_id)
