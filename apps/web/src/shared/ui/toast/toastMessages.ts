export const toastMessages = {
  auth: {
    sessionExpired: "세션이 만료되어 다시 로그인해주세요.",
    logoutSuccess: "로그아웃되었습니다.",
  },
  post: {
    created: "게시글이 등록되었습니다.",
    createdWithWarning: "AI 경고를 확인하고 게시했습니다.",
    updated: "게시글이 수정되었습니다.",
    deleted: "게시글이 삭제되었습니다.",
  },
  reply: {
    created: "답글이 등록되었습니다.",
    createdWithWarning: "AI 경고를 확인하고 답글을 등록했습니다.",
  },
  chat: {
    notConnected: "실시간 연결이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
  },
  profile: {
    updateSuccess: "공개 설정이 변경되었습니다.",
    updateFail: "설정 변경에 실패했습니다.",
    logoutFail: "로그아웃 처리에 실패했습니다.",
  },
  ai: {
    reviewFail: "AI 검토 연결이 불안정합니다. 잠시 후 다시 시도해주세요.",
  },
} as const;

