import { apiRequest } from "./httpClient";
import { AiReviewResponseSchema } from "./contracts";
import type { AiReviewRequest, AiReviewResponse } from "./contracts";

export const aiApi = {
  async review(payload: AiReviewRequest) {
    return await apiRequest<AiReviewResponse>("/ai/review", {
      method: "POST",
      body: payload,
    }, { schema: AiReviewResponseSchema });
  },
};

