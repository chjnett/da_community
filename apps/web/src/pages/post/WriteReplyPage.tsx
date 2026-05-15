import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import type { AiVerdict, ReviewState } from '../../types';
import { useSeniorAdvice } from '../../features/ai/hooks/useSeniorAdvice';
import { aiApi } from '../../shared/api/aiApi';
import { postApi } from '../../shared/api/postApi';
import { queryClient } from '../../shared/api/queryClient';
import { AiReviewModal } from '../../components/ai/AiReviewModal';
import { useToast } from '../../shared/ui/toast/ToastProvider';
import { toastMessages } from '../../shared/ui/toast/toastMessages';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';

import { useQuery } from '@tanstack/react-query';

export const WriteReplyPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { postId } = useParams();

  // 실제 게시글 정보 가져오기
  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postId ? postApi.getById(postId) : null,
    enabled: !!postId,
  });

  const [content, setContent] = useState('');
  const [reviewState, setReviewState] = useState<ReviewState>('NONE');
  const [modalMessage, setModalMessage] = useState('');
  const [modalVerdict, setModalVerdict] = useState<AiVerdict | null>(null);
  
  // AI 선배 조언 훅 (글자 수 제한을 5자로 완화하여 더 빨리 반응하게 함)
  const liveAdvice = useSeniorAdvice('답글', content, { debounceMs: 800, minLength: 5 });

  const isFilled = content.trim().length > 0;

  const handleRegister = async () => {
    if (!postId || !isFilled) return;
    setReviewState('REVIEWING');

    try {
      // 1. AI 검토
      const res = await aiApi.review({ title: '답글', content: content.trim() });
      
      // 2. 검토 결과 처리
      if (res.verdict === 'OK') {
        await postApi.createReply(postId, { content: content.trim() });
        queryClient.invalidateQueries({ queryKey: ['post-replies', postId] });
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
        toast.success(toastMessages.reply.created);
        navigate(-1);
        return;
      }

      setModalMessage(res.suggestion || '답글 표현을 조금 더 부드럽게 다듬어보면 좋아요.');
      setModalVerdict(res.verdict);
      setReviewState('WARNING');
    } catch (err) {
      // 우회 모드/테스트용: 실패 시에도 더미 성공 처리 가능하지만, 
      // 여기서는 실제 API 호출을 시도하고 실패 시 에러 표시
      toast.error(getUserErrorMessage(err, toastMessages.ai.reviewFail));
      
      // 테스트 편의를 위해 만약 404/서버 에러라면 강제로 등록 (선택 사항)
      // await postApi.createReply(postId, { content: content.trim() }).catch(() => {});
      
      setModalMessage('AI 검토 연결이 잠시 불안정해요. 답글 표현을 한 번 더 확인해 주세요.');
      setModalVerdict('SOFT_WARN');
      setReviewState('WARNING');
    }
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
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-bold text-[#3A001E]">{post?.author.realName || '...'}</span>
              <span>님에게 답장하는 중</span>
            </div>
            {/* AI 상태 표시 배지 */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-gray-100 shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full ${liveAdvice.loading ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-[10px] font-bold text-gray-400">AI Safety</span>
            </div>
          </div>
          <textarea
            autoFocus
            placeholder="내이름을 걸고 하는 말인 만큼, 서로를 존중하는 따뜻한 답글을 남겨주세요."
            className="flex-1 w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          {liveAdvice.loading ? <p className="text-xs text-gray-400 mt-3">AI 선배가 답글을 확인하고 있어요...</p> : null}
          {liveAdvice.verdict && liveAdvice.verdict !== 'OK' && liveAdvice.suggestion ? (
            <div className={`mt-3 rounded-xl border px-3 py-2 ${liveAdvice.verdict === 'BLOCK' ? 'border-red-100 bg-red-50' : 'border-pink-100 bg-pink-50'}`}>
              <p className={`text-xs font-medium leading-relaxed ${liveAdvice.verdict === 'BLOCK' ? 'text-red-600' : 'text-[#E61E54]'}`}>
                {liveAdvice.suggestion}
              </p>
            </div>
          ) : null}
        </div>
        <AiReviewModal
          reviewState={reviewState}
          verdict={modalVerdict}
          onEdit={() => {
            setReviewState('NONE');
            setModalVerdict(null);
          }}
          onSubmit={async () => {
            if (!postId) return;
            try {
              await postApi.createReply(postId, { content: content.trim(), forcePublish: true });
              queryClient.invalidateQueries({ queryKey: ['post-replies', postId] });
              queryClient.invalidateQueries({ queryKey: ['post', postId] });
              toast.info(toastMessages.reply.createdWithWarning);
              navigate(-1);
            } catch (err) {
              toast.error(getUserErrorMessage(err, '답글 등록에 실패했습니다.'));
            }
          }}
          message={modalMessage || undefined}
        />
      </div>
    </div>
  );
};
