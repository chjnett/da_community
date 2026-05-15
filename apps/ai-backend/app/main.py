import os
import re
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
    source: str

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

from openai import OpenAI

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def run_openai_review(content: str) -> AiReviewResponse | None:
    if not client:
        return None
    
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "너는 대학 커뮤니티의 친절한 '선배' 아바타다. 욕설만이 아니라 인신공격, 비아냥, 조롱, 낙인찍기, 단정적 비난(예: '너는 원래 그런 사람'), 집단 일반화 비난(예: '요즘 XX는 다 문제다')도 검토 대상이다. 판정 기준: 명백한 모욕/혐오/폭력 유도는 BLOCK, 공격적 뉘앙스/비난성 표현/인격 평가 중심 문장은 SOFT_WARN, 중립적 사실 공유와 정중한 비판은 OK. toxicity/harassment를 0~1로 산출하고 verdict(OK|SOFT_WARN|BLOCK)를 일관되게 내려라. suggestion은 SOFT_WARN/BLOCK일 때만 1~2문장으로 부드럽게 제안하고, OK면 빈 문자열로 둬라. 반드시 JSON만 응답: { 'toxicity': float, 'harassment': float, 'verdict': 'OK'|'SOFT_WARN'|'BLOCK', 'suggestion': string }"},
                {"role": "user", "content": content}
            ],
            response_format={"type": "json_object"}
        )
        import json
        res_data = json.loads(response.choices[0].message.content)
        
        return AiReviewResponse(
            verdict=res_data.get('verdict', 'OK'),
            scores=AiScores(
                toxicity=res_data.get('toxicity', 0.0),
                harassment=res_data.get('harassment', 0.0)
            ),
            suggestion=res_data.get('suggestion', ''),
            requestId=f'rvw_{uuid4()}',
            source=f'openai:{OPENAI_MODEL}'
        )
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return None

# --- Logic ---
def _review_text(content: str) -> AiReviewResponse:
    # 1. OpenAI API Key가 있는 경우 고급 분석 수행
    if OPENAI_API_KEY:
        result = run_openai_review(content)
        if result:
            return result

    # 2. 기본 키워드 스코어링 방식 (Fallback)
    text = content.lower().strip()
    compact = re.sub(r'[\s\W_]+', '', text)

    block_patterns = [
        r'병\s*신', r'애\s*미', r'개\s*새\s*끼', r'ㅅㅂ', r'시\s*발', r'좆', r'죽\s*어', r'죽\s*여',
        r'꺼\s*져', r'자\s*살', r'강\s*간', r'ntr', r'능\s*욕', r'인\s*종\s*차\s*별',
    ]
    warn_patterns = [
        r'짜\s*증', r'빡\s*치', r'극\s*혐', r'역\s*겨', r'한\s*심', r'열\s*받', r'존\s*나',
        r'멍\s*청', r'바\s*보', r'저\s*능', r'혐\s*오',
    ]
    blame_patterns = [
        r'너(는|가)\s*문제', r'니가\s*문제', r'네가\s*문제', r'인성\s*문제', r'수준\s*떨어',
        r'답\s*없', r'정신\s*차려', r'한심하다', r'원래\s*그런\s*사람', r'같은\s*부류',
        r'다\s*문제', r'전부\s*문제', r'쟤네는\s*원래',
    ]

    block_hits = sum(1 for p in block_patterns if re.search(p, text) or re.search(p, compact))
    warn_hits = sum(1 for p in warn_patterns if re.search(p, text) or re.search(p, compact))
    blame_hits = sum(1 for p in blame_patterns if re.search(p, text) or re.search(p, compact))

    # 반복 공격성(동일 부호/감탄/물음) 가중치
    punct_boost = 0.05 if re.search(r'[!?]{3,}', text) else 0.0

    toxicity = min(1.0, 0.08 + block_hits * 0.32 + warn_hits * 0.14 + blame_hits * 0.16 + punct_boost)
    harassment = min(1.0, 0.05 + block_hits * 0.36 + warn_hits * 0.12 + blame_hits * 0.18 + punct_boost)

    if block_hits >= 1 or toxicity >= 0.72 or harassment >= 0.72:
        return AiReviewResponse(
            verdict='BLOCK',
            scores=AiScores(toxicity=toxicity, harassment=harassment),
            suggestion='표현이 공격적으로 보일 수 있어요. 사실과 요청 중심으로 정중하게 다시 작성해 주세요.',
            requestId=f'rvw_{uuid4()}',
            source='fallback:rule-v2',
        )

    if warn_hits >= 1 or blame_hits >= 1 or toxicity >= 0.42 or harassment >= 0.42:
        return AiReviewResponse(
            verdict='SOFT_WARN',
            scores=AiScores(toxicity=toxicity, harassment=harassment),
            suggestion='감정 표현을 조금만 완화하면 더 많은 공감을 얻을 수 있어요. 구체적인 상황을 덧붙여 볼까요?',
            requestId=f'rvw_{uuid4()}',
            source='fallback:rule-v2',
        )

    return AiReviewResponse(
        verdict='OK',
        scores=AiScores(toxicity=0.08, harassment=0.04),
        suggestion='',
        requestId=f'rvw_{uuid4()}',
        source='fallback:rule-v2',
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
