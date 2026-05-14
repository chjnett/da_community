// ============================================================
// components/ai/AiReviewModal.tsx — AI 선배 검토 모달
// (WritePostScreen, WriteReplyScreen에서 공통으로 사용)
// ============================================================
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { AiVerdict, ReviewState } from '../../types';

interface AiReviewModalProps {
  reviewState: ReviewState;
  verdict?: AiVerdict | null;
  onEdit: () => void;
  onSubmit: () => void;
  message?: string;
}

export const AiReviewModal: React.FC<AiReviewModalProps> = ({
  reviewState,
  verdict = 'SOFT_WARN',
  onEdit,
  onSubmit,
  message = '"표현이 다소 날카롭게 들릴 수 있어요. 사실을 중심으로 조금만 더 부드럽게 다듬어보면 어떨까요? 당당한 실명 문화를 함께 만들어가요!"',
}) => {
  if (reviewState === 'NONE') return null;

  return (
    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl p-6 flex flex-col animate-in slide-in-from-bottom-full duration-300">
        {reviewState === 'REVIEWING' ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-gray-600 font-bold">AI 거울이 글을 비춰보는 중...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-[#E61E54] mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-extrabold text-lg">AI 선배의 조언</span>
            </div>
            <p className="text-gray-800 font-bold mb-2">잠깐, 글을 올리기 전에 확인해볼까요?</p>
            <div className={`${verdict === 'BLOCK' ? 'bg-red-50 border-red-100' : 'bg-pink-50 border-pink-100'} p-4 rounded-xl border mb-6`}>
              <p className={`text-sm ${verdict === 'BLOCK' ? 'text-red-600' : 'text-[#E61E54]'} font-medium leading-relaxed`}>{message}</p>
            </div>
            <div className={`flex ${verdict === 'BLOCK' ? 'space-x-0' : 'space-x-3'}`}>
              <button
                onClick={onEdit}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                수정하기
              </button>
              {verdict !== 'BLOCK' ? (
                <button
                  onClick={onSubmit}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  그래도 올리기
                </button>
              ) : null}
            </div>
            {verdict === 'BLOCK' ? (
              <p className="text-[11px] text-red-500 font-semibold mt-3">강한 비하/조롱 표현이 감지되어 수정이 필요해요.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
