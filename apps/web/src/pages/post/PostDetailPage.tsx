import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, ThumbsUp, MessageSquare, UserCircle2, Pencil, Trash2 } from 'lucide-react';
import { postApi } from '../../shared/api/postApi';
import type { PostDetail } from '../../shared/api/postApi';
import { useToast } from '../../shared/ui/toast/ToastProvider';
import { toastMessages } from '../../shared/ui/toast/toastMessages';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';

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

import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../../shared/api/queryClient';

export const PostDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { postId } = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: post, isLoading: loading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is missing');
      const detail = await postApi.getById(postId);
      setEditTitle(detail.title);
      setEditContent(detail.content);
      return detail;
    },
    enabled: !!postId,
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['post-replies', postId],
    queryFn: () => {
      if (!postId) return [];
      return postApi.listReplies(postId);
    },
    enabled: !!postId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) => {
      if (!postId) throw new Error('Post ID is missing');
      return postApi.update(postId, payload);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['post', postId], updated);
      setEditMode(false);
      setMenuOpen(false);
      toast.success(toastMessages.post.updated);
    },
    onError: (err) => {
      toast.error(getUserErrorMessage(err, '게시글 수정에 실패했습니다.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!postId) throw new Error('Post ID is missing');
      return postApi.remove(postId);
    },
    onSuccess: () => {
      toast.success(toastMessages.post.deleted);
      navigate('/boards', { replace: true });
    },
    onError: (err) => {
      toast.error(getUserErrorMessage(err, '게시글 삭제에 실패했습니다.'));
    }
  });

  const likeMutation = useMutation({
    mutationFn: () => {
      if (!postId) throw new Error('Post ID is missing');
      return postApi.likePost(postId);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['post', postId], updated);
      // 피드 목록도 최신화하기 위해 인발리데이션 고려 가능
    },
    onError: (err) => {
      toast.error(getUserErrorMessage(err, '좋아요 처리에 실패했습니다.'));
    }
  });

  const errorMessage = error ? getUserErrorMessage(error, '게시글을 불러오지 못했습니다.') : null;

  const canSave = useMemo(
    () => editTitle.trim().length > 0 && editContent.trim().length > 0,
    [editTitle, editContent],
  );

  const handleSave = async () => {
    if (!postId || !canSave || updateMutation.isPending) return;
    updateMutation.mutate({
      title: editTitle.trim(),
      content: editContent.trim(),
    });
  };

  const handleDelete = async () => {
    if (!postId || deleteMutation.isPending) return;
    const ok = window.confirm('게시글을 삭제할까요? 이 작업은 되돌릴 수 없습니다.');
    if (!ok) return;
    deleteMutation.mutate();
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 z-50">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      {menuOpen && !loading && !errorMessage && post ? (
        <div className="mx-4 mt-2 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => {
              setEditMode(true);
              setMenuOpen(false);
            }}
            className="w-full bg-white px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            수정하기
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full bg-white px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 border-t border-gray-100 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        {loading ? <p className="px-5 py-6 text-sm text-gray-500">게시글을 불러오는 중...</p> : null}
        {errorMessage ? (
          <div className="mx-5 mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500 font-medium">
            {errorMessage}
          </div>
        ) : null}
        {!loading && !errorMessage && post ? (
          <>
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
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatCreatedAt(post.createdAt)}</p>
                </div>
              </div>
              {editMode ? (
                <div className="space-y-3 mb-4">
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-primary"
                  />
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full min-h-36 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditTitle(post.title);
                        setEditContent(post.content);
                      }}
                      className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-600"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!canSave || updateMutation.isPending}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${canSave && !updateMutation.isPending ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {updateMutation.isPending ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>
                  <p className="text-base text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* 이미지 표시 */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex flex-col gap-3 mb-6">
                      {post.images.map((img, i) => (
                        <img 
                          key={i} 
                          src={img.startsWith('http') ? img : `/api/v1/files/${img}`} 
                          className="w-full rounded-2xl border border-gray-100 shadow-sm"
                          alt={`Post image ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center space-x-3 text-sm">
                <button 
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${likeMutation.isPending ? 'bg-gray-50 text-gray-400' : 'text-primary bg-primary/5 hover:bg-primary/10'}`}
                >
                  <ThumbsUp className="w-4 h-4" /><span>{post.likesCount}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg font-bold">
                  <MessageSquare className="w-4 h-4" /><span>{replies.length || post.repliesCount}</span>
                </button>
              </div>
            </div>

            {/* 답글 영역 */}
            <div className="bg-[#F9FAFB] p-5 pb-28">
              <h3 className="font-bold text-gray-900 mb-4 tracking-tight">답글 {replies.length || post.repliesCount}</h3>
              {repliesLoading ? (
                <p className="text-sm text-gray-400">답글을 불러오는 중...</p>
              ) : replies.length > 0 ? (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-800">{reply.author.realName}</span>
                          {reply.author.dept && <span className="text-[10px] text-gray-400 font-medium">{reply.author.dept}</span>}
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium">{formatCreatedAt(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">아직 답글이 없습니다.<br/>첫 번째 따뜻한 한마디를 남겨보세요.</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-3 pb-6 flex items-center justify-center">
        <button
          onClick={() => postId && navigate(`/posts/${postId}/reply`)}
          className="w-full bg-gray-100 text-gray-500 text-left px-4 py-3 rounded-full text-sm font-medium flex items-center space-x-2 transition-colors hover:bg-gray-200"
        >
          <MessageSquare className="w-4 h-4" />
          <span>따뜻한 답글을 남겨주세요...</span>
        </button>
      </div>
    </div>
  );
};
