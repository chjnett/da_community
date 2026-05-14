import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ThumbsUp, MessageSquare, Landmark, Menu } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { DUMMY_POSTS } from '../../data/dummyData';

export const CampusFeedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="absolute inset-0 w-full h-full bg-[#F9FAFB] flex flex-col animate-in fade-in z-30">
      <div className="bg-[#FAFAFA] px-5 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10">
        <button className="text-[#E61E54]" onClick={() => navigate('/categories')}>
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
      <div className="flex-1 overflow-y-auto pb-24 pt-2">
        {DUMMY_POSTS.map(post => (
          <div
            key={post.id}
            className="bg-white p-5 border-y border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer active:bg-gray-50 mb-2"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-red-100 text-[#E61E54] text-[10px] font-bold rounded-md tracking-wider">HOT</span>
              <span className="text-xs font-bold text-gray-500">자유게시판</span>
            </div>
            <h2 className="text-base font-bold text-[#1A1A1A] mb-1.5">{post.title}</h2>
            <p className="text-sm text-[#8C8C8C] line-clamp-2 leading-relaxed mb-3">{post.content}</p>
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
              <span>{post.author.realName} · {post.createdAt}</span>
              <div className="flex items-center space-x-3">
                <span className="text-primary font-bold flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> {post.stats.likes}</span>
                <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> {post.stats.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav currentPath="/feed" navigate={navigate} />
    </div>
  );
};
