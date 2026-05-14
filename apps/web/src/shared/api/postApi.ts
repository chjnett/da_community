import { apiRequest } from "./httpClient";
import { PostDetailSchema, ReplySchema } from "./contracts";
import type { PostCreateRequest, PostUpdateRequest, PostDetail, Reply, ReplyCreateRequest } from "./contracts";

export const postApi = {
  async create(payload: PostCreateRequest) {
    return await apiRequest<PostDetail>("/posts", {
      method: "POST",
      body: payload,
    }, { schema: PostDetailSchema });
  },

  async getById(postId: string) {
    return await apiRequest<PostDetail>(`/posts/${encodeURIComponent(postId)}`, {
      method: "GET",
    }, { schema: PostDetailSchema });
  },

  async update(postId: string, payload: PostUpdateRequest) {
    return await apiRequest<PostDetail>(`/posts/${encodeURIComponent(postId)}`, {
      method: "PATCH",
      body: payload,
    }, { schema: PostDetailSchema });
  },

  async remove(postId: string) {
    return await apiRequest<void>(`/posts/${encodeURIComponent(postId)}`, {
      method: "DELETE",
    });
  },

  async likePost(postId: string) {
    return await apiRequest<PostDetail>(`/posts/${encodeURIComponent(postId)}/like`, {
      method: "POST",
    }, { schema: PostDetailSchema });
  },

  async listReplies(postId: string) {
    return await apiRequest<Reply[]>(`/posts/${encodeURIComponent(postId)}/replies`, {
      method: "GET",
    }, { schema: ReplySchema.array() });
  },

  async createReply(postId: string, payload: ReplyCreateRequest) {
    return await apiRequest<Reply>(`/posts/${encodeURIComponent(postId)}/replies`, {
      method: "POST",
      body: payload,
    }, { schema: ReplySchema });
  },
};
