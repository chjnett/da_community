import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, SendHorizonal } from 'lucide-react';
import { chatApi } from '../../shared/api/chatApi';
import type { ChatMessage } from '../../shared/api/chatApi';
import { ChatSocketManager } from '../../shared/chat/socketManager';
import type { ChatSocketStatus } from '../../shared/chat/socketManager';
import { tokenStorage } from '../../shared/api/tokenStorage';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { toastMessages } from '../../shared/ui/toast/toastMessages';

function formatCreatedAt(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  return `${Math.floor(diffMs / hour)}시간 전`;
}

function statusLabel(status: ChatSocketStatus) {
  if (status === 'connected') return '실시간 연결됨';
  if (status === 'connecting') return '연결 중';
  if (status === 'disconnected') return '연결 끊김';
  if (status === 'error') return '연결 오류';
  return '대기 중';
}

interface UiChatMessage extends ChatMessage {
  mine?: boolean;
  pending?: boolean;
  failed?: boolean;
  clientMessageId?: string;
}

export const LoungePage: React.FC = () => {
  const navigate = useNavigate();
  const { roomId = 'campus-lounge' } = useParams();
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatSocketStatus>('idle');
  const managerRef = useRef<ChatSocketManager | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingLocalMapRef = useRef<Map<string, string>>(new Map());
  const pendingTimeoutRef = useRef<Map<string, number>>(new Map());

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await chatApi.listMessages(roomId);
        if (cancelled) return;
        setMessages(data.items.map(item => ({ ...item, mine: false, pending: false, failed: false })));
      } catch (err) {
        if (cancelled) return;
        setError(getUserErrorMessage(err, '채팅 메시지를 불러오지 못했습니다.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const manager = new ChatSocketManager();
    managerRef.current = manager;

    const accessToken = tokenStorage.getAccessToken() ?? undefined;
    manager.connect(roomId, accessToken);

    const unsubscribeStatus = manager.onStatusChange(next => {
      setStatus(next);
    });
    const unsubscribeMessage = manager.onMessage(event => {
      if (event.payload.roomId !== roomId) return;

      if (event.type === 'message.ack') {
        const localId = pendingLocalMapRef.current.get(event.payload.clientMessageId);
        if (!localId) return;

        const timeoutId = pendingTimeoutRef.current.get(event.payload.clientMessageId);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          pendingTimeoutRef.current.delete(event.payload.clientMessageId);
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === localId
              ? { ...msg, pending: false, failed: false, id: event.payload.messageId ?? msg.id }
              : msg,
          ),
        );
        return;
      }

      const incoming = event.payload;
      const clientMessageId = incoming.clientMessageId;

      if (clientMessageId) {
        const localId = pendingLocalMapRef.current.get(clientMessageId);
        if (localId) {
          const timeoutId = pendingTimeoutRef.current.get(clientMessageId);
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            pendingTimeoutRef.current.delete(clientMessageId);
          }
          pendingLocalMapRef.current.delete(clientMessageId);

          setMessages(prev =>
            prev.map(msg =>
              msg.id === localId
                ? {
                    id: incoming.id,
                    roomId: incoming.roomId,
                    senderId: incoming.senderId,
                    content: incoming.content,
                    createdAt: incoming.createdAt,
                    mine: true,
                    pending: false,
                    failed: false,
                    clientMessageId,
                  }
                : msg,
            ),
          );
          return;
        }
      }

      setMessages(prev => {
        if (prev.some(msg => msg.id === incoming.id)) return prev;
        return [
          ...prev,
          {
            id: incoming.id,
            roomId: incoming.roomId,
            senderId: incoming.senderId,
            content: incoming.content,
            createdAt: incoming.createdAt,
            mine: false,
            pending: false,
            failed: false,
          },
        ];
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      pendingTimeoutRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
      pendingTimeoutRef.current.clear();
      pendingLocalMapRef.current.clear();
      manager.disconnect();
      managerRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!canSend) return;
    const content = input.trim();
    const clientMessageId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const localId = `local-${clientMessageId}`;

    const sent = managerRef.current?.sendMessage({ content, clientMessageId });
    if (!sent) {
      setError(toastMessages.chat.notConnected);
      return;
    }

    pendingLocalMapRef.current.set(clientMessageId, localId);
    const timeoutId = window.setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.clientMessageId === clientMessageId && msg.pending
            ? { ...msg, pending: false, failed: true }
            : msg,
        ),
      );
      pendingLocalMapRef.current.delete(clientMessageId);
      pendingTimeoutRef.current.delete(clientMessageId);
    }, 8000);
    pendingTimeoutRef.current.set(clientMessageId, timeoutId);

    setInput('');
    setMessages(prev => [
      ...prev,
      {
        id: localId,
        roomId,
        senderId: 'me',
        content,
        createdAt: new Date().toISOString(),
        mine: true,
        pending: true,
        failed: false,
        clientMessageId,
      },
    ]);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 z-50">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-gray-900">실시간 라운지</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 rounded-full border border-orange-100">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-orange-600">36.5°C</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">{statusLabel(status)}</p>
        </div>
        <div className="w-6" />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9FAFB]">
        {loading ? <p className="text-sm text-gray-500">메시지를 불러오는 중...</p> : null}
        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-500 font-medium">
            {error}
          </div>
        ) : null}
        {!loading && messages.length === 0 ? (
          <p className="text-sm text-gray-400">아직 메시지가 없습니다. 첫 메시지를 남겨보세요.</p>
        ) : null}
        {messages.map(msg => {
          const mine = Boolean(msg.mine);
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl ${mine ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.pending ? <p className="text-[10px] mt-1 text-pink-100">전송 중...</p> : null}
                {msg.failed ? <p className="text-[10px] mt-1 text-yellow-200">전송 확인 지연</p> : null}
                <p className={`text-[10px] mt-1 ${mine ? 'text-pink-100' : 'text-gray-400'}`}>{formatCreatedAt(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 bg-white px-3 py-3 pb-6">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') sendMessage();
            }}
            placeholder="메시지를 입력하세요"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className={`w-11 h-11 rounded-full flex items-center justify-center ${canSend ? 'bg-primary text-white' : 'bg-gray-100 text-gray-300'}`}
          >
            <SendHorizonal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
