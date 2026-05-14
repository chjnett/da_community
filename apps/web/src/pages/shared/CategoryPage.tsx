import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Landmark } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';

const BOARDS = [
  {
    title: '자유게시판',
    tags: ['일상', '학업', '고민상담']
  },
  {
    title: '구인게시판',
    tags: ['팀플', '공모전', '대외활동']
  }
];

export const CategoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in z-30">
      {/* 상단 헤더 (CampusFeed와 동일한 스타일) */}
      <div className="bg-white px-5 py-4 flex items-center justify-between relative z-10">
        <button onClick={() => navigate(-1)} className="text-[#E61E54]">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-1.5 absolute left-1/2 -translate-x-1/2">
          <Landmark className="w-5 h-5 text-[#E61E54]" strokeWidth={2} />
          <h1 className="text-[17px] font-bold text-[#E61E54] tracking-wide">경기대학교</h1>
        </div>
        <button onClick={() => navigate('/search')} className="text-[#E61E54]">
          <Search className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-24">
        {/* 타이틀 */}
        <h2 className="text-[22px] font-black text-[#E61E54] tracking-[0.1em] mb-6">CATEGORIE</h2>

        {/* 게시판 목록 */}
        <div className="space-y-4">
          {BOARDS.map((board, idx) => (
            <div 
              key={idx}
              className="w-full bg-white border border-pink-100 rounded-[1.2rem] p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(230,30,84,0.05)] active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => navigate(`/boards/${board.title}`)}
            >
              <span className="text-base font-bold text-[#E61E54]">{board.title}</span>
              <div className="flex items-center space-x-1.5">
                {board.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2.5 py-1 rounded-full border border-pink-200 text-[10px] font-bold text-[#E61E54]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav currentPath="/categories" navigate={navigate} />

      {/* 우측 하단 장식용 화살표 (디자인 참고) */}
      <div className="absolute bottom-28 right-8 text-[#E61E54] opacity-20 pointer-events-none">
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
         </svg>
      </div>
    </div>
  );
};
