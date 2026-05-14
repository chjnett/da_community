const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const rawWsBase = import.meta.env.VITE_WS_BASE_URL;

export const env = {
  // 개발 모드일 때는 무조건 로컬 포트 고정, 아니면 환경변수 사용
  apiBaseUrl: import.meta.env.DEV ? "http://127.0.0.1:8787/api/v1" : (import.meta.env.VITE_API_BASE_URL || "/api/v1"),
  wsBaseUrl: import.meta.env.DEV ? "ws://127.0.0.1:8000" : (import.meta.env.VITE_WS_BASE_URL || ""),
  isDev: import.meta.env.DEV,
};

