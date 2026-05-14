import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, ChevronRight } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';

const BOARDS = [
  { id: 'free',     label: '자유게시판' },
  { id: 'freshman', label: '새내기게시판' },
  { id: 'career',   label: '취업/진로' },
];

export const BoardListPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 w-full h-full bg-[#F9FAFB] flex flex-col animate-in fade-in z-30">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm relative z-10">
        <h1 className="text-lg font-bold text-[#1A1A1A]">게시판</h1>
        <button onClick={() => navigate('/search')} className="p-2 -mr-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {BOARDS.map((board, i) => (
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className={`p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer ${i < BOARDS.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-primary" />
                <span className="font-bold text-gray-900">{board.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
      <BottomNav currentPath="/boards" navigate={navigate} />
    </div>
  );
};
