import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Loader2, Sparkles } from 'lucide-react';
import type { ReviewState } from '../../types';
import { DUMMY_POSTS } from '../../data/dummyData';

export const WriteReplyPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const post = DUMMY_POSTS.find(p => p.id === postId) ?? DUMMY_POSTS[0];
  const [content, setContent] = useState('');
  const [reviewState, setReviewState] = useState<ReviewState>('NONE');

  const isFilled = content.trim().length > 0;

  const handleRegister = () => {
    if (!isFilled) return;
    setReviewState('REVIEWING');
    setTimeout(() => setReviewState('WARNING'), 1500);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black/40 flex flex-col justify-end z-[60] animate-in fade-in duration-200">
      <div className="bg-white w-full h-[85%] rounded-t-3xl flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl relative overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">답글 쓰기</h1>
          <button
            onClick={handleRegister}
            disabled={!isFilled}
            className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${isFilled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
          >
            등록
          </button>
        </div>
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="font-bold text-[#3A001E]">{post.author.realName}</span>
            <span>님에게 답장하는 중</span>
          </div>
          <textarea
            autoFocus
            placeholder="내이름을 걸고 하는 말인 만큼, 서로를 존중하는 따뜻한 답글을 남겨주세요."
            className="flex-1 w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        {reviewState !== 'NONE' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 animate-in fade-in duration-200">
            {reviewState === 'REVIEWING' ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-800 font-bold">AI 선배가 답글을 읽어보고 있어요...</p>
              </div>
            ) : (
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(230,30,84,0.12)] border border-pink-100 animate-in zoom-in-95 duration-300">
                <div className="flex items-center space-x-2 text-[#E61E54] mb-3 justify-center">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-extrabold text-lg">AI 선배의 조언</span>
                </div>
                <p className="text-gray-800 font-bold text-center mb-4">최종적으로 올리기 전에 확인해주세요!</p>
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-6">
                  <p className="text-sm text-[#E61E54] font-medium leading-relaxed text-center">
                    "상대방이 오해할 수 있는 단어가 포함되어 있어요. 한 번 더 따뜻하게 다듬어서 보내는 건 어떨까요?"
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button onClick={() => setReviewState('NONE')} className="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">수정하기</button>
                  <button onClick={() => navigate(-1)} className="w-full py-3.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">그래도 답글 달기</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
