# Worker API (Gateway)

## Env

```bash
cp .env.example .env
```

## Run

```bash
npm install
npm run dev
```

## Notes
- `AI_BACKEND_URL` points to FastAPI backend.
- `DB_DRIVER=sqlite|d1` (`sqlite` for local dev).
- `.env` is auto-loaded by `server.mjs`.
- `d1` mode requires Cloudflare Workers D1 binding (`DB`).
