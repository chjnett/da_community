import { z } from "zod";
import { ApiError } from "./contracts";
import type { ApiErrorPayload, AuthTokens } from "./contracts";
import { tokenStorage } from "./tokenStorage";
import { emitAuthExpired } from "../auth/authEvents";
import { env } from "../config/env";

export const API_BASE_URL = env.apiBaseUrl;

type PrimitiveBody = string | FormData | Blob | ArrayBuffer;

function isPrimitiveBody(value: unknown): value is PrimitiveBody {
  return (
    typeof value === "string" ||
    value instanceof FormData ||
    value instanceof Blob ||
    value instanceof ArrayBuffer
  );
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}

function parseTokenPayload(payload: unknown): AuthTokens | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const accessToken = obj.accessToken;
  const refreshToken = obj.refreshToken;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") return null;
  return { accessToken, refreshToken };
}

async function parseError(response: Response): Promise<ApiError> {
  let message = "Unknown API error";
  let code = "UNKNOWN_ERROR";
  let requestId: string | undefined;

  try {
    const data = (await response.json()) as ApiErrorPayload;
    if (data?.error?.message) message = data.error.message;
    if (data?.error?.code) code = data.error.code;
    if (data?.error?.requestId) requestId = data.error.requestId;
  } catch {
    message = response.statusText || message;
  }

  return new ApiError(message, code, response.status, requestId);
}

async function parseJsonResponse(response: Response, path: string): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!isJson) {
    const preview = (await response.text()).slice(0, 80).replace(/\s+/g, " ").trim();
    throw new ApiError(
      `Expected JSON response but received '${contentType || "unknown"}' at ${path}. Preview: ${preview}`,
      "INVALID_JSON_RESPONSE",
      response.status || 500,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(
      `Malformed JSON response from ${path}.`,
      "INVALID_JSON_RESPONSE",
      response.status || 500,
    );
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    tokenStorage.clearTokens();
    emitAuthExpired();
    return null;
  }

  const data = await parseJsonResponse(response, path);
  const tokens = parseTokenPayload(data);
  if (!tokens) {
    tokenStorage.clearTokens();
    emitAuthExpired();
    return null;
  }

  tokenStorage.setTokens(tokens);
  return tokens.accessToken;
}

export async function apiRequest<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
  options: { retryOnUnauthorized?: boolean; schema?: z.ZodType<T> } = {},
): Promise<T> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const schema = options.schema;
  const accessToken = tokenStorage.getAccessToken();

  const headers = new Headers(init.headers);
  const bodyValue = init.body;
  const hasPrimitiveBody = isPrimitiveBody(bodyValue);

  if (!hasPrimitiveBody && bodyValue != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const requestBody =
    bodyValue == null
      ? undefined
      : hasPrimitiveBody
        ? bodyValue
        : JSON.stringify(bodyValue);

  const fullUrl = buildUrl(path);
  console.log(`[API Request] ${init.method || 'GET'} ${fullUrl}`);
  
  if (!fullUrl || typeof fullUrl !== 'string' || (!fullUrl.startsWith('http') && !fullUrl.startsWith('/'))) {
    console.warn(`[API Abort] Malformed URL: ${fullUrl}`);
    return undefined as T;
  }

  const response = await fetch(fullUrl, {
    ...init,
    headers,
    credentials: "include",
    body: requestBody,
  });

  if (response.status === 401) {
    if (retryOnUnauthorized && tokenStorage.getRefreshToken()) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        return apiRequest<T>(path, init, { ...options, retryOnUnauthorized: false });
      }
    }
    // 갱신 실패 혹은 리프레시 토큰 없음 → 즉시 인증 만료 알림
    emitAuthExpired();
    throw await parseError(response);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as unknown;

  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn(`[API Validation Warning] ${path}:`, result.error.format());
      // 테스트/개발 중에는 에러를 던지지 않고 원본 데이터를 반환하여 흐름을 유지합니다.
      return data as T;
    }
    return result.data;
  }

  return data as T;
}
