import { ApiError } from "../api/contracts";

const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "입력값을 다시 확인해주세요.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "이 작업에 대한 권한이 없습니다.",
  NOT_FOUND: "요청한 정보를 찾을 수 없습니다.",
  CONFLICT: "이미 처리된 요청입니다. 잠시 후 다시 시도해주세요.",
  RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
  INTERNAL_ERROR: "일시적인 서버 오류가 발생했습니다.",
  UNKNOWN_ERROR: "일시적인 오류가 발생했습니다. 다시 시도해주세요.",
};

export function getUserErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return ERROR_CODE_MESSAGES[error.code] ?? error.message ?? fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  return fallbackMessage;
}

