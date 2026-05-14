import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, PenLine, MessagesSquare } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { BottomNav } from '../../components/common/BottomNav';
import { boardApi } from '../../shared/api/boardApi';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useQuery } from '@tanstack/react-query';
import type { PostItem } from '../../shared/api/contracts';

function formatCreatedAt(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  return `${Math.floor(diffMs / day)}일 전`;
}

export const BoardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { boardId = 'free' } = useParams();

  const { data: boardInfo, isLoading: boardLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.listBoards(),
    select: (boards) => boards.find(b => b.slug === boardId),
  });

  const { data: posts = [], isLoading: postsLoading, error } = useQuery({
    queryKey: ['board-posts', boardId],
    queryFn: async () => {
      const postData = await boardApi.listBoardPosts(boardId);
      return postData.items.map((item: PostItem) => ({
        id: item.id,
        boardId,
        title: item.title,
        content: item.content,
        createdAt: formatCreatedAt(item.createdAt),
        author: {
          realName: item.author.realName,
          dept: item.author.dept,
          sid: item.author.sid,
        },
        stats: {
          likes: 0,
          comments: 0,
        },
      }));
    },
  });

  const title = boardInfo?.name || boardId;
  const loading = boardLoading || postsLoading;
  const errorMessage = error ? getUserErrorMessage(error, '게시글 목록을 불러오지 못했습니다.') : null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F9FAFB] flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 z-50">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm relative z-10">
        <button onClick={() => navigate('/boards')} className="p-2 -ml-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-[#1A1A1A]">{title}</h1>
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/lounge/${boardId}`)}
            className="p-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors"
          >
            <MessagesSquare className="w-5 h-5" />
          </button>
          <button className="p-2 -mr-2 text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? <p className="px-4 py-4 text-sm text-gray-500">게시글을 불러오는 중...</p> : null}
        {errorMessage ? (
          <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500 font-medium">
            {errorMessage}
          </div>
        ) : null}
        {!loading && !errorMessage ? (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={(id) => navigate(`/posts/${id}`)} />
            ))}
            {posts.length === 0 ? <p className="px-4 py-8 text-sm text-gray-500">아직 게시글이 없습니다.</p> : null}
          </>
        ) : null}
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
