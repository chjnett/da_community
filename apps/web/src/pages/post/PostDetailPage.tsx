import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, ThumbsUp, MessageSquare, UserCircle2 } from 'lucide-react';
import { DUMMY_POSTS } from '../../data/dummyData';

export const PostDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const post = DUMMY_POSTS.find(p => p.id === postId) ?? DUMMY_POSTS[0];

  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 z-50">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#3A001E]">{post.author.realName}</span>
                {post.author.dept && <><span className="w-[3px] h-[3px] bg-gray-300 rounded-full" /><span className="text-[11px] text-gray-500 font-bold">{post.author.dept}</span></>}
                {post.author.sid  && <><span className="w-[3px] h-[3px] bg-gray-300 rounded-full" /><span className="text-[11px] text-gray-500 font-bold">{post.author.sid}</span></>}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{post.createdAt}</p>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <p className="text-base text-gray-800 leading-relaxed mb-6">{post.content}</p>
          <div className="flex items-center space-x-3 text-sm">
            <button className="flex items-center space-x-1.5 text-primary bg-primary/5 px-3 py-1.5 rounded-lg font-bold">
              <ThumbsUp className="w-4 h-4" /><span>{post.stats.likes}</span>
            </button>
            <button className="flex items-center space-x-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg font-bold">
              <MessageSquare className="w-4 h-4" /><span>{post.stats.comments}</span>
            </button>
          </div>
        </div>
        <div className="bg-[#F9FAFB] p-5 pb-28">
          <h3 className="font-bold text-gray-900 mb-4">답글 {post.stats.comments}</h3>
          <div className="mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
              <span className="font-bold text-[#3A001E]">김민수</span>
              <span className="w-[3px] h-[3px] bg-gray-300 rounded-full" />
              <span className="font-bold text-gray-500">경영학과</span>
              <span className="flex-1 text-right text-[10px] text-gray-400">5분 전</span>
            </div>
            <p className="text-sm text-gray-800">환영합니다! 경영학과도 인사드려요 👋</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-3 pb-6 flex items-center justify-center">
        <button
          onClick={() => navigate(`/posts/${post.id}/reply`)}
          className="w-full bg-gray-100 text-gray-500 text-left px-4 py-3 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors hover:bg-gray-200"
        >
          <MessageSquare className="w-4 h-4" />
          <span>따뜻한 답글을 남겨주세요...</span>
        </button>
      </div>
    </div>
  );
};
