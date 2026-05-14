// ============================================================
// data/dummyData.ts — 더미 데이터 (API 연동 전 임시 사용)
// 실제 API 연동 시 이 파일을 api/ 폴더로 교체
// ============================================================
import type { Post, Notification } from '../types';

export const DUMMY_POSTS: Post[] = [
  {
    id: 'p_1',
    boardId: 'free',
    title: '다걸고 첫 글 남겨봅니다!',
    content: '실명 커뮤니티라니 신기하네요. 다들 방가방가~ 앞으로 클린한 소통 기대해봅니다.',
    createdAt: '방금 전',
    author: { realName: '홍길동', dept: '컴퓨터공학부', sid: '23학번' },
    stats: { likes: 12, comments: 5 },
  },
  {
    id: 'p_2',
    boardId: 'free',
    title: '오늘 학식 메뉴 뭔가요?',
    content: '어제 제육볶음은 진짜 맛있었는데 오늘은 메뉴를 못 봤어요. 아시는 분?',
    createdAt: '10분 전',
    author: { realName: '이지은', dept: '경영학과' }, // 학번 비공개
    stats: { likes: 3, comments: 2 },
  },
  {
    id: 'p_3',
    boardId: 'free',
    title: '공학관 3층에서 에어팟 주우신 분',
    content: '화장실에 에어팟 프로 두고 온 것 같습니다. 혹시 보신 분 댓글 부탁드립니다!!',
    createdAt: '1시간 전',
    author: { realName: '박준호' }, // 학과, 학번 모두 비공개
    stats: { likes: 0, comments: 0 },
  },
];

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: 'n_1',
    kind: 'reply',
    message: '님이 내 글에 따뜻한 답글을 남겼습니다.',
    createdAt: '방금 전',
    read: false,
    targetPostId: 'p_1',
  },
  {
    id: 'n_2',
    kind: 'like',
    message: '내 게시물이 10개의 공감을 받았습니다.',
    subText: '다걸고 첫 글 남겨봅니다!',
    createdAt: '10분 전',
    read: false,
    targetPostId: 'p_1',
  },
  {
    id: 'n_3',
    kind: 'reply',
    message: '님이 내 글에 답글을 남겼습니다.',
    createdAt: '2시간 전',
    read: true,
    targetPostId: 'p_2',
  },
  {
    id: 'n_4',
    kind: 'hot',
    message: '내 게시물이 HOT 게시물로 선정되었습니다!',
    subText: '오늘 학식 메뉴 뭔가요?',
    createdAt: '어제',
    read: true,
    targetPostId: 'p_2',
  },
];
