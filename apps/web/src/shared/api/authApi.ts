import { apiRequest } from "./httpClient";
import { tokenStorage } from "./tokenStorage";
import { AuthTokensSchema, UserProfileSchema } from "./contracts";
import type { AuthTokens } from "./contracts";
import type { UserProfile } from "../../types";

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  realName: string;
  dept?: string;
  sid?: string;
  password: string;
}

interface AuthResponse extends AuthTokens {
  userId: string;
}

export const authApi = {
  async signup(payload: SignupRequest) {
    const data = await apiRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: payload,
    });
    tokenStorage.setTokens(data);
    return data;
  },

  async login(payload: LoginRequest) {
    const data = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
    tokenStorage.setTokens(data);
    return data;
  },

  async refresh() {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    const data = await apiRequest<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }, { schema: AuthTokensSchema });
    tokenStorage.setTokens(data);
    return data;
  },

  async logout() {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async getMe() {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) return null;

    return await apiRequest<UserProfile>("/auth/me", {
      method: "GET",
    }, { schema: UserProfileSchema });
  },

  async updateMe(payload: Partial<UserProfile>) {
    return await apiRequest<UserProfile>("/auth/me", {
      method: "PATCH",
      body: payload,
    }, { schema: UserProfileSchema });
  },

  async getStats() {
    return await apiRequest<{ postCount: number; replyCount: number; likeCount: number }>("/auth/stats", {
      method: "GET",
    });
  },
};
