// ============================================================
// components/post/PostCard.tsx — 게시글 카드 컴포넌트
// ============================================================
import React from 'react';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import type { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => (
  <div
    onClick={() => onClick(post.id)}
    className="bg-white p-4 mb-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:bg-gray-50 transition-colors cursor-pointer"
  >
    {/* 작성자 정보 (실명 필수 + 선택 정보) */}
    <div className="flex items-center space-x-2 text-[11px] text-gray-500 mb-2">
      <span className="font-bold text-[#3A001E]">{post.author.realName}</span>
      {post.author.dept && (
        <>
          <span className="w-[3px] h-[3px] bg-gray-300 rounded-full" />
          <span>{post.author.dept}</span>
        </>
      )}
      {post.author.sid && (
        <>
          <span className="w-[3px] h-[3px] bg-gray-300 rounded-full" />
          <span>{post.author.sid}</span>
        </>
      )}
      <span className="flex-1 text-right font-medium text-gray-400">{post.createdAt}</span>
    </div>

    <h2 className="text-base font-bold text-[#1A1A1A] mb-1.5">{post.title}</h2>
    <p className="text-sm text-[#8C8C8C] line-clamp-2 leading-relaxed mb-3">{post.content}</p>

    {/* 통계 */}
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1.5 text-primary bg-primary/5 px-2 py-1 rounded-md">
        <ThumbsUp className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">{post.stats.likes}</span>
      </div>
      <div className="flex items-center space-x-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">{post.stats.comments}</span>
      </div>
    </div>
  </div>
);
