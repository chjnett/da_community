import { apiRequest } from "./httpClient";
import { UserStatsSchema, UserReportSchema } from "./contracts";
import type { UserStats, UserReport } from "./contracts";

export const statsApi = {
  async getMyStats() {
    return await apiRequest<UserStats>("/stats/me", {
      method: "GET",
    }, { schema: UserStatsSchema });
  },

  async getMyReport() {
    return await apiRequest<UserReport>("/stats/report", {
      method: "GET",
    }, { schema: UserReportSchema });
  },
};
