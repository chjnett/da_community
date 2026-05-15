export * from "@dageolgo/core";

// FE specific contracts if any can be added here
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

export interface AiReviewRequest {
  title: string;
  content: string;
  authorId?: string;
}

export interface PostCreateRequest {
  boardId: number | string;
  title: string;
  content: string;
  images?: string[];
  forcePublish?: boolean;
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  images?: string[];
}

export interface ReplyCreateRequest {
  content: string;
  forcePublish?: boolean;
}
