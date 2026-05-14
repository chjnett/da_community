import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { AiReviewModal } from '../../components/ai/AiReviewModal';
import type { ReviewState } from '../../types';

export const WritePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [reviewState, setReviewState] = useState<ReviewState>('NONE');

  const isFilled = title.trim().length > 0 && content.trim().length > 0;

  const handleRegister = () => {
    if (!isFilled) return;
    setReviewState('REVIEWING');
    setTimeout(() => setReviewState('WARNING'), 1500);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300 z-50">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">글 쓰기</h1>
        <button
          onClick={handleRegister}
          disabled={!isFilled}
          className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${isFilled ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          등록
        </button>
      </div>
      <div className="flex-1 p-5 flex flex-col">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          className="text-xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-4"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div className="w-full h-px bg-gray-100 mb-4" />
        <textarea
          placeholder="다걸고는 실명 기반의 따뜻한 커뮤니티입니다. 타인을 존중하는 마음으로 글을 작성해주세요."
          className="flex-1 w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <AiReviewModal
        reviewState={reviewState}
        onEdit={() => setReviewState('NONE')}
        onSubmit={() => navigate(-1)}
      />
    </div>
  );
};
