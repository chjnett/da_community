# RUN GUIDE

## 서비스 구성
- Web: `apps/web` (`5173`)
- Worker API: `apps/worker-api` (`8787`)
- AI Backend: `apps/ai-backend` (`8000`)

## 권장 실행
루트에서:
```bash
npm install
npm run dev
```

## 개별 실행
### 1) AI Backend
```bash
cd apps/ai-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2) Worker API
```bash
cd apps/worker-api
npm install
npm run dev
```

### 3) Web
```bash
cd apps/web
npm install
npm run dev
```

## 점검 포인트
- 로그인 후 `GET /api/v1/auth/me` 200
- 프로필 통계 `GET /api/v1/stats/me` 200
- 알림 `GET /api/v1/notifications` 200 (인증 필요)
