import { z } from "zod";
import type { AiVerdict } from "../../types";

export const ApiErrorPayloadSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

export type ApiErrorPayload = z.infer<typeof ApiErrorPayloadSchema>;

export class ApiError extends Error {
  code: string;
  requestId?: string;
  status: number;

  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const UserProfileSchema = z.object({
  realName: z.string(),
  university: z.string(),
  dept: z.string().optional(),
  sid: z.string().optional(),
  isDeptOpen: z.boolean(),
  isSidOpen: z.boolean(),
});

export const AiReviewResponseSchema = z.object({
  verdict: z.enum(["OK", "SOFT_WARN", "BLOCK"]),
  scores: z.object({
    toxicity: z.number(),
    harassment: z.number(),
  }),
  suggestion: z.string(),
  requestId: z.string().optional(),
});

export type AiReviewResponse = z.infer<typeof AiReviewResponseSchema>;

export const BoardSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  type: z.enum(["CAMPUS", "LOUNGE"]),
});

export type Board = z.infer<typeof BoardSchema>;

export const PostItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  likesCount: z.number().optional().default(0),
  repliesCount: z.number().optional().default(0),
  createdAt: z.string(),
  author: z.object({
    realName: z.string(),
    dept: z.string().optional(),
    sid: z.string().optional(),
  }),
});
export type PostItem = z.infer<typeof PostItemSchema>;

export const UserStatsSchema = z.object({
  postCount: z.number().optional().default(0),
  replyCount: z.number().optional().default(0),
  likeCount: z.number().optional().default(0),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

export const UserReportSchema = z.object({
  month: z.number().optional(),
  summary: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  temperature: z.number().optional().default(36.5),
});

export type UserReport = z.infer<typeof UserReportSchema>;

export const PostDetailSchema = z.object({
  id: z.string(),
  boardId: z.union([z.number(), z.string()]),
  title: z.string(),
  content: z.string(),
  images: z.array(z.string()).optional().default([]),
  likesCount: z.number().optional().default(0),
  repliesCount: z.number().optional().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  author: z.object({
    id: z.string(),
    realName: z.string(),
    dept: z.string().optional(),
    sid: z.string().optional(),
  }),
});

export type PostDetail = z.infer<typeof PostDetailSchema>;

export const PostListPageSchema = z.object({
  items: z.array(PostItemSchema),
  nextCursor: z.string().optional(),
});
export type PostListPage = z.infer<typeof PostListPageSchema>;

export interface AiReviewRequest {
  title: string;
  content: string;
  authorId?: string;
}

export interface PostCreateRequest {
  boardId: number;
  title: string;
  content: string;
  images?: string[];
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  images?: string[];
}

export const ReplySchema = z.object({
  id: z.string(),
  postId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: z.object({
    id: z.string(),
    realName: z.string(),
    dept: z.string().optional(),
    sid: z.string().optional(),
  }),
});

export type Reply = z.infer<typeof ReplySchema>;

export interface ReplyCreateRequest {
  content: string;
}
