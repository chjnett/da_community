import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-right-8 z-50">
      <div className="px-4 py-3 flex items-center space-x-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-800 -ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="게시글 검색..."
            className="bg-transparent flex-1 outline-none text-sm font-medium text-gray-800 placeholder-gray-400"
            autoFocus
          />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">인기 검색어</h3>
        <div className="flex flex-wrap gap-2">
          {['학식', '수강신청', '도서관', '과팅', '족보'].map(kw => (
            <span key={kw} className="px-3 py-1.5 bg-pink-50 border border-pink-100 text-[#E61E54] rounded-full text-xs font-bold cursor-pointer hover:bg-pink-100 transition-colors">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
