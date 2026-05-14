// ============================================================
// types/index.ts — 다걸고 공통 타입 정의 (D1 스키마 정책 반영)
// ============================================================

/** 게시글 작성자 (실명 필수, 나머지 선택) */
export interface Author {
  realName: string;
  dept?: string;
  sid?: string;
}

/** 게시글 */
export interface Post {
  id: string;
  boardId: string; // 어떤 게시판인지 (e.g. "free", "freshman", "career")
  title: string;
  content: string;
  createdAt: string;
  author: Author;
  stats: {
    likes: number;
    comments: number;
  };
}

/** 댓글/답글 */
export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: Author;
}

/** 알림 타입 */
export type NotificationKind = "reply" | "like" | "hot";

export interface Notification {
  id: string;
  kind: NotificationKind;
  message: string;
  subText?: string;
  createdAt: string;
  read: boolean;
  targetPostId?: string;
}

/** AI 리뷰 상태 */
export type ReviewState = "NONE" | "REVIEWING" | "WARNING";

/** 사용자 프로필 (로그인 세션용) */
export interface UserProfile {
  realName: string;
  university: string;
  dept?: string;
  sid?: string;
  showDept: boolean;
  showSid: boolean;
}
