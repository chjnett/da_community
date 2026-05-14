import { env } from "../config/env";

export type ChatSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export type ChatIncomingMessage =
  | {
      type: "message.created";
      payload: {
        id: string;
        roomId: string;
        senderId: string;
        content: string;
        createdAt: string;
        clientMessageId?: string;
      };
    }
  | {
      type: "message.ack";
      payload: {
        roomId: string;
        clientMessageId: string;
        messageId?: string;
      };
    };

interface ChatSendPayload {
  content: string;
  clientMessageId?: string;
}

type MessageListener = (message: ChatIncomingMessage) => void;
type StatusListener = (status: ChatSocketStatus) => void;

function resolveSocketUrl(roomId: string) {
  const encodedRoomId = encodeURIComponent(roomId);
  
  // 1. 환경변수에 완전한 URL이 있는 경우 (wss://... 등)
  if (env.wsBaseUrl && (env.wsBaseUrl.startsWith("ws://") || env.wsBaseUrl.startsWith("wss://"))) {
    return `${env.wsBaseUrl}/ws/chat/${encodedRoomId}`;
  }

  // 2. 로컬 개발 환경 기본값 (FastAPI: 8000 포트)
  if (env.isDev) {
    return `ws://127.0.0.1:8000/ws/chat/${encodedRoomId}`;
  }

  // 3. 운영 환경 (Cloudflare 등)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws/chat/${encodedRoomId}`;
}

export class ChatSocketManager {
  private ws: WebSocket | null = null;
  private status: ChatSocketStatus = "idle";
  private messageListeners = new Set<MessageListener>();
  private statusListeners = new Set<StatusListener>();
  private currentRoomId: string | null = null;
  private reconnectTimer: number | null = null;
  private reconnectCount = 0;
  private maxReconnectCount = 5;

  connect(roomId: string, accessToken?: string) {
    if (!roomId) {
      console.warn("[Socket Skip] No roomId provided");
      this.updateStatus("error");
      return;
    }

    this.disconnect();
    this.currentRoomId = roomId;
    this.updateStatus("connecting");

    const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
    const wsUrl = `${resolveSocketUrl(roomId)}${tokenQuery}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectCount = 0;
        this.updateStatus("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as ChatIncomingMessage;
          this.messageListeners.forEach(listener => listener(parsed));
        } catch {
          console.warn("[Socket] Failed to parse message", event.data);
        }
      };

      this.ws.onerror = (err) => {
        console.error("[Socket Error]", err);
        this.updateStatus("error");
      };

      this.ws.onclose = () => {
        this.updateStatus("disconnected");
        this.scheduleReconnect(accessToken);
      };
    } catch (err) {
      console.error("[Socket Connection Error]", err);
      this.updateStatus("error");
    }
  }

  sendMessage(payload: string | ChatSendPayload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    const data: ChatSendPayload = typeof payload === "string" ? { content: payload } : payload;

    this.ws.send(
      JSON.stringify({
        type: "message.create",
        payload: data,
      }),
    );
    return true;
  }

  disconnect() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus("idle");
  }

  onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private scheduleReconnect(accessToken?: string) {
    if (!this.currentRoomId || this.reconnectCount >= this.maxReconnectCount) return;
    const delay = Math.min(1000 * 2 ** this.reconnectCount, 10000);
    this.reconnectCount += 1;
    this.reconnectTimer = window.setTimeout(() => {
      if (this.currentRoomId) {
        this.connect(this.currentRoomId, accessToken);
      }
    }, delay);
  }

  private updateStatus(next: ChatSocketStatus) {
    this.status = next;
    this.statusListeners.forEach(listener => listener(next));
  }
}
