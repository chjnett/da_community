# AI Backend (FastAPI)

## Env

```bash
cp .env.example .env
```

## Run

```bash
../../venv/bin/pip install -r requirements.txt
set -a; source .env; set +a
../../venv/bin/uvicorn app.main:app --host ${HOST:-127.0.0.1} --port ${PORT:-8000}
```

## Endpoints
- `GET /health`
- `POST /api/v1/ai/review`
