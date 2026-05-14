import { apiRequest } from "./httpClient";
import { BoardSchema, PostListPageSchema } from "./contracts";
import type { Board, PostListPage } from "./contracts";

export const boardApi = {
  async listBoards() {
    return await apiRequest<Board[]>("/boards", {
      method: "GET",
    }, { schema: BoardSchema.array() });
  },

  async listBoardPosts(slug: string, cursor?: string) {
    const encodedSlug = encodeURIComponent(slug);
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return await apiRequest<PostListPage>(`/boards/${encodedSlug}/posts${suffix}`, {
      method: "GET",
    }, { schema: PostListPageSchema });
  },
};
