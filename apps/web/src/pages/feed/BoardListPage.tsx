import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, ChevronRight } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { boardApi } from '../../shared/api/boardApi';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useQuery } from '@tanstack/react-query';

export const BoardListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: boards = [], isLoading: loading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.listBoards(),
  });

  const errorMessage = error ? getUserErrorMessage(error, '게시판 목록을 불러오지 못했습니다.') : null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F9FAFB] flex flex-col animate-in fade-in z-30">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm relative z-10">
        <h1 className="text-lg font-bold text-[#1A1A1A]">게시판</h1>
        <button onClick={() => navigate('/search')} className="p-2 -mr-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {loading ? <p className="text-sm text-gray-500 px-1">게시판을 불러오는 중...</p> : null}
        {errorMessage ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500 font-medium">
            {errorMessage}
          </div>
        ) : null}
        {!loading && !errorMessage ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {boards.map((board, i) => (
              <div
                key={board.id}
                onClick={() => navigate(`/boards/${board.slug}`)}
                className={`p-4 flex items-center justify-between active:bg-gray-50 cursor-pointer ${i < boards.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900">{board.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
            {boards.length === 0 ? <p className="p-4 text-sm text-gray-500">등록된 게시판이 없습니다.</p> : null}
          </div>
        ) : null}
      </div>
      <BottomNav currentPath="/boards" navigate={navigate} />
    </div>
  );
};
