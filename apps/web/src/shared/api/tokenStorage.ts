import type { AuthTokens } from "./contracts";

const ACCESS_TOKEN_KEY = "dageolgo_access_token";
const REFRESH_TOKEN_KEY = "dageolgo_refresh_token";

export const tokenStorage = {
  getAccessToken(): string | null {
    const val = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (val === "null" || val === "undefined" || !val) return null;
    return val;
  },
  getRefreshToken(): string | null {
    const val = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (val === "null" || val === "undefined" || !val) return null;
    return val;
  },
  setTokens(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  resetAll() {
    localStorage.clear();
    sessionStorage.clear();
  }
};

