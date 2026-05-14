import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Settings, FileText, MessageSquare, Heart } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { useUserStore } from '../../store/userStore';
import { statsApi } from '../../shared/api/statsApi';
import { useQuery } from '@tanstack/react-query';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => {
      const data = await statsApi.getMyStats();
      console.log('[ProfileStats] Received:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: report } = useQuery({
    queryKey: ['my-report'],
    queryFn: () => statsApi.getMyReport(),
    enabled: !!user,
  });

  return (
    <div className="absolute inset-0 w-full h-full bg-[#FAFAFA] flex flex-col animate-in fade-in z-30 overflow-y-auto pb-24">
      <div className="px-5 py-4 flex items-center justify-between">
        <button className="text-[#E61E54]"><Menu className="w-6 h-6" /></button>
        <h1 className="text-[17px] font-bold text-[#E61E54]">프로필</h1>
        <button onClick={() => navigate('/profile/settings')} className="text-[#E61E54]">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* 명찰 */}
      <div className="flex justify-center mt-4">
        <div className="relative flex flex-col items-center justify-center">
          <svg width="180" height="130" viewBox="0 0 180 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="75" y="5"  width="30" height="20" rx="4" stroke="#4A4A4A" strokeWidth="1.5" />
            <rect x="25" y="25" width="130" height="90" rx="8" stroke="#4A4A4A" strokeWidth="1.5" fill="white" />
          </svg>
          <span className="absolute top-[65px] text-4xl font-semibold text-[#1A1A1A] tracking-widest">{user?.realName ?? '...'}</span>
        </div>
      </div>

      {/* 통계 */}
      <div className="flex justify-center items-center space-x-12 mt-8 mb-6">
        {[
          { icon: <FileText className="w-8 h-8 text-[#E61E54]" strokeWidth={1.5} />, count: statsLoading ? '..' : String(stats?.postCount ?? 0).padStart(2, '0') },
          { icon: <MessageSquare className="w-8 h-8 text-[#E61E54]" strokeWidth={1.5} />, count: statsLoading ? '..' : String(stats?.replyCount ?? 0).padStart(2, '0') },
          { icon: <Heart className="w-8 h-8 text-[#E61E54]" strokeWidth={1.5} />, count: statsLoading ? '..' : String(stats?.likeCount ?? 0).padStart(2, '0') },
        ].map(({ icon, count }, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="relative">{icon}</div>
            <span className="text-2xl font-bold text-[#E61E54]">{count}</span>
          </div>
        ))}
      </div>

      {/* 대화 리포트 */}
      <div className="px-5 mb-6">
        <div className="bg-[#FFF5F8] border border-[#E61E54]/60 rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#E61E54] mb-3">{report?.month || new Date().getMonth() + 1}월 대화 리포트</p>
          <h2 className="text-lg font-bold text-[#E61E54] mb-6 leading-snug">
            이번 달 {user?.realName}님의 대화는...<br />'{report?.summary || '따뜻했어요'}'
          </h2>
          <div className="flex flex-wrap gap-2">
            {report?.keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-[#FFF5F8] border border-[#E61E54]/60 rounded-lg text-[10px] font-bold text-[#E61E54]">{kw}</span>
            ))}
            {(!report || report.keywords.length === 0) && (
              <p className="text-[10px] text-pink-300">활동을 시작하면 리포트가 생성됩니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 작성한 글 목록 */}
      <div className="px-5 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="w-5 h-5 text-[#E61E54]" strokeWidth={2} />
          <h3 className="font-bold text-[#E61E54] text-sm">작성한 글 목록</h3>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200/60 rounded-xl p-4 cursor-pointer" onClick={() => navigate('/feed')}>
          <p className="text-[11px] text-gray-500">최근 활동 내역이 여기에 표시됩니다.</p>
        </div>
      </div>

      <BottomNav currentPath="/profile" navigate={navigate} />
    </div>
  );
};
