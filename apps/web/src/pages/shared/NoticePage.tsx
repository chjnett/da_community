import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Sparkles } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { DUMMY_NOTIFICATIONS } from '../../data/dummyData';
import type { NotificationKind } from '../../types';

const iconMap: Record<NotificationKind, React.ReactNode> = {
  reply: <MessageSquare className="w-5 h-5" />,
  like:  <ThumbsUp     className="w-5 h-5" />,
  hot:   <Sparkles     className="w-5 h-5" />,
};

const colorMap: Record<NotificationKind, string> = {
  reply: 'bg-[#E61E54]/10 text-[#E61E54]',
  like:  'bg-[#E61E54]/10 text-[#E61E54]',
  hot:   'bg-orange-100 text-orange-500',
};

export const NoticePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in z-30">
      <div className="px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-100">
        <h1 className="text-lg font-bold text-[#1A1A1A]">알림</h1>
        <button className="text-[13px] font-bold text-gray-400 hover:text-gray-600 transition-colors">모두 읽음</button>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {DUMMY_NOTIFICATIONS.map(n => (
          <div
            key={n.id}
            onClick={() => n.targetPostId && navigate(`/posts/${n.targetPostId}`)}
            className={`p-4 border-b border-gray-50 flex items-start space-x-3 cursor-pointer transition-colors ${n.read ? 'bg-white active:bg-gray-50' : 'bg-pink-50/40 active:bg-pink-100'}`}
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorMap[n.kind]}`}>
                {iconMap[n.kind]}
              </div>
              {!n.read && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#E61E54] border-2 border-white rounded-full" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm leading-relaxed ${n.read ? 'text-gray-600' : 'text-gray-800'}`}>{n.message}</p>
              {n.subText && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{n.subText}</p>}
              <p className={`text-[11px] mt-1 font-${n.read ? 'medium text-gray-400' : 'bold text-[#E61E54]'}`}>{n.createdAt}</p>
            </div>
          </div>
        ))}
      </div>
      <BottomNav currentPath="/notice" navigate={navigate} />
    </div>
  );
};
