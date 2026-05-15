import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { AiReviewModal } from '../../components/ai/AiReviewModal';
import type { AiVerdict, ReviewState } from '../../types';
import { aiApi } from '../../shared/api/aiApi';
import { postApi } from '../../shared/api/postApi';
import { boardApi } from '../../shared/api/boardApi';
import { fileApi } from '../../shared/api/fileApi';
import { useSeniorAdvice } from '../../features/ai/hooks/useSeniorAdvice';
import { useToast } from '../../shared/ui/toast/ToastProvider';
import { useUserStore } from '../../store/userStore';
import { toastMessages } from '../../shared/ui/toast/toastMessages';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const WritePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const boardSlug = searchParams.get('board') || 'free';
  const toast = useToast();
  const { user } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title,       setTitle]       = useState('');
  const [content,     setContent]     = useState('');
  const [images,      setImages]      = useState<string[]>([]); // R2 object keys
  const [previews,    setPreviews]    = useState<string[]>([]); // Local URLs
  const [uploading,   setUploading]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 게시판 목록을 가져와서 현재 슬러그에 맞는 ID 찾기
  const { data: boards } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardApi.listBoards(),
  });

  const currentBoard = boards?.find(b => b.slug === boardSlug) || boards?.[0];
  const boardId = currentBoard?.id || 1;
  
  const [reviewState, setReviewState] = useState<ReviewState>('NONE');
  const [modalMessage, setModalMessage] = useState('');
  const [modalVerdict, setModalVerdict] = useState<AiVerdict | null>(null);

  const liveAdvice = useSeniorAdvice(title, content, { debounceMs: 1000, minLength: 10 });

  const isFilled = title.trim().length > 0 && content.trim().length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 서버로 직접 업로드하고 고유 키와 URL을 받아옵니다.
        const { key, url } = await fileApi.upload(file);
        
        setImages(prev => [...prev, key]);
        setPreviews(prev => [...prev, url]);
      }
    } catch (err) {
      toast.error(getUserErrorMessage(err, '이미지 업로드에 실패했습니다.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegister = async () => {
    if (!isFilled || uploading) return;
    setReviewState('REVIEWING');

    try {
      const res = await aiApi.review({ title: title.trim(), content: content.trim() });

      if (res.verdict === 'OK') {
        await submitPost();
        return;
      }

      setModalMessage(
        res.suggestion || 'OO아, 표현이 조금 강하게 들릴 수 있어. 사실 중심으로 한 번만 다듬어보자.',
      );
      setModalVerdict(res.verdict);
      setReviewState('WARNING');
    } catch (err) {
      toast.error(getUserErrorMessage(err, toastMessages.ai.reviewFail));
      setModalMessage('AI 검토 연결이 잠시 불안정해. 내용을 한 번 더 확인하고 올릴지 선택해줘.');
      setModalVerdict('SOFT_WARN');
      setReviewState('WARNING');
    }
  };

  const submitPost = async (forcePublish = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await postApi.create({ 
        boardId, 
        title: title.trim(), 
        content: content.trim(), 
        images,
        forcePublish,
      });
      toast.success(toastMessages.post.created);
      queryClient.invalidateQueries({ queryKey: ['campus-feed'] });
      queryClient.invalidateQueries({ queryKey: ['board-posts'] });
      navigate(-1);
    } catch (err) {
      toast.error(getUserErrorMessage(err, '게시글 등록에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={!isFilled || uploading}
          className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${isFilled && !uploading ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          등록
        </button>
      </div>
      <div className="flex-1 p-5 flex flex-col overflow-y-auto">
        {/* 명찰 미리보기 (가이드 8.3 준수) */}
        <div className="mb-8 flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-primary shadow-sm">
              <span className="text-xs font-bold">{user?.realName?.[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900">{user?.realName}</span>
                <span className="text-[10px] text-gray-400 font-medium">로 게시됩니다</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {user?.isDeptOpen && user?.dept ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-pink-50 text-[#E61E54] rounded-md font-bold">{user.dept}</span>
                ) : null}
                {user?.isSidOpen && user?.sid ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-pink-50 text-[#E61E54] rounded-md font-bold">{user.sid}학번</span>
                ) : null}
                {!user?.isDeptOpen && !user?.isSidOpen && (
                  <span className="text-[10px] text-gray-400">학과/학번 비공개</span>
                )}
              </div>
            </div>
          </div>
          {/* AI 상태 표시 배지 */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-gray-100 shadow-sm self-start">
            <div className={`w-1.5 h-1.5 rounded-full ${liveAdvice.loading ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">AI Safe</span>
          </div>
        </div>

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
          className="w-full text-base text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed mb-6 min-h-[200px]"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        {/* 이미지 프리뷰 */}
        {previews.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 flex-shrink-0">
                <img src={src} className="w-full h-full object-cover rounded-xl border border-gray-100" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-gray-900/80 text-white p-1 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            )}
          </div>
        )}

        {liveAdvice.loading ? (
          <div className="flex items-center gap-2 mt-4 px-1">
            <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            <p className="text-[11px] text-gray-400 font-medium">AI 선배가 문장을 확인하고 있어요...</p>
          </div>
        ) : null}
        {liveAdvice.verdict && liveAdvice.verdict !== 'OK' && liveAdvice.suggestion ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 animate-in fade-in zoom-in-95 duration-300 ${
            liveAdvice.verdict === 'BLOCK' 
              ? 'border-red-100 bg-red-50/50' 
              : 'border-pink-100 bg-pink-50/50'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                liveAdvice.verdict === 'BLOCK' ? 'bg-red-100 text-red-600' : 'bg-pink-100 text-[#E61E54]'
              }`}>
                AI 선배의 조언
              </span>
            </div>
            <p className={`text-xs font-bold leading-relaxed ${
              liveAdvice.verdict === 'BLOCK' ? 'text-red-600' : 'text-[#E61E54]'
            }`}>
              {liveAdvice.suggestion}
            </p>
          </div>
        ) : null}
      </div>

      {/* 툴바 */}
      <div className="border-t border-gray-100 p-3 flex items-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm font-medium">사진</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
        <button className="flex items-center gap-2 text-gray-500">
          <ImageIcon className="w-6 h-6" />
          <span className="text-sm font-medium">앨범</span>
        </button>
      </div>

      <AiReviewModal
        reviewState={reviewState}
        verdict={modalVerdict}
        onEdit={() => {
          setReviewState('NONE');
          setModalVerdict(null);
        }}
        onSubmit={() => submitPost(true)}
        message={modalMessage || undefined}
      />
    </div>
  );
};
