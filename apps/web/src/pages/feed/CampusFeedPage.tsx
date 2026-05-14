import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ThumbsUp, MessageSquare, Landmark, Menu } from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { boardApi } from '../../shared/api/boardApi';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useQuery } from '@tanstack/react-query';
import type { Board, PostItem } from '../../shared/api/contracts';

interface FeedItem {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  boardName: string;
  authorName: string;
}

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

export const CampusFeedPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: items = [], isLoading: loading, error } = useQuery({
    queryKey: ['campus-feed'],
    queryFn: async (): Promise<FeedItem[]> => {
      const boards = await boardApi.listBoards();
      if (!boards || !Array.isArray(boards)) return [];

      const pages = await Promise.all(
        boards.map(async (board: Board): Promise<FeedItem[]> => {
          try {
            const postPage = await boardApi.listBoardPosts(board.slug);
            if (!postPage || !postPage.items) return [];
            
            return postPage.items.map((item: PostItem): FeedItem => ({
              id: item.id,
              title: item.title,
              content: item.content,
              likesCount: item.likesCount || 0,
              repliesCount: item.repliesCount || 0,
              createdAt: item.createdAt,
              boardName: board.name,
              authorName: item.author.realName,
            }));
          } catch (err) {
            console.warn(`Failed to fetch posts for board: ${board.slug}`, err);
            return [];
          }
        }),
      );

      const merged = pages.flat();
      merged.sort((a: FeedItem, b: FeedItem) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
        return bTime - aTime;
      });
      return merged;
    }
  });

  const errorMessage = error ? getUserErrorMessage(error, '캠퍼스 피드를 불러오지 못했습니다.') : null;

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
        {loading ? <p className="px-5 py-4 text-sm text-gray-500">캠퍼스 피드를 불러오는 중...</p> : null}
        {errorMessage ? (
          <div className="mx-5 mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500 font-medium">
            {errorMessage}
          </div>
        ) : null}
        {!loading && !errorMessage ? (
          <>
            {items.map((post: FeedItem, index: number) => (
              <div
                key={post.id}
                className="bg-white p-5 border-y border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer active:bg-gray-50 mb-2"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <div className="flex items-center space-x-2 mb-3">
                  {index < 3 ? (
                    <span className="px-2 py-1 bg-red-100 text-[#E61E54] text-[10px] font-bold rounded-md tracking-wider">HOT</span>
                  ) : null}
                  <span className="text-xs font-bold text-gray-500">{post.boardName}</span>
                </div>
                <h2 className="text-base font-bold text-[#1A1A1A] mb-1.5">{post.title}</h2>
                <p className="text-sm text-[#8C8C8C] line-clamp-2 leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span>{post.authorName} · {formatCreatedAt(post.createdAt)}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-primary font-bold flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" /> {post.likesCount}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" /> {post.repliesCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 ? <p className="px-5 py-6 text-sm text-gray-500">표시할 게시글이 없습니다.</p> : null}
          </>
        ) : null}
      </div>
      <BottomNav currentPath="/feed" navigate={navigate} />
    </div>
  );
};
