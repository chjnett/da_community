import { apiRequest } from "./httpClient";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export const chatApi = {
  listMessages(roomId: string, cursor?: string) {
    const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiRequest<{ items: ChatMessage[]; nextCursor?: string }>(
      `/chat/rooms/${roomId}/messages${suffix}`,
      { method: "GET" },
    );
  },
};

