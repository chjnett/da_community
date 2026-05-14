import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, PenLine } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { BottomNav } from '../../components/common/BottomNav';
import { DUMMY_POSTS } from '../../data/dummyData';

const BOARD_LABELS: Record<string, string> = {
  free: '자유게시판',
  freshman: '새내기게시판',
  career: '취업/진로',
};

export const BoardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { boardId = 'free' } = useParams();
  const posts = DUMMY_POSTS.filter(p => p.boardId === boardId);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F9FAFB] flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 z-50">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm relative z-10">
        <button onClick={() => navigate('/boards')} className="p-2 -ml-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-[#1A1A1A]">{BOARD_LABELS[boardId] ?? boardId}</h1>
        <button className="p-2 -mr-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onClick={(id) => navigate(`/posts/${id}`)} />
        ))}
      </div>
      <button
        onClick={() => navigate('/posts/write')}
        className="absolute bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(230,30,84,0.4)] hover:scale-105 active:scale-95 transition-all z-20"
      >
        <PenLine className="w-6 h-6" />
      </button>
      <BottomNav currentPath="/boards" navigate={navigate} />
    </div>
  );
};
