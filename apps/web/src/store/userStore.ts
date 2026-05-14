// ============================================================
// store/userStore.ts — 전역 사용자 상태 (Zustand 패턴, 추후 교체 용이)
// ============================================================
import { useState } from 'react';
import type { UserProfile } from '../types';

// 더미 초기 사용자 데이터 (API 연동 전)
const INITIAL_USER: UserProfile = {
  realName: '이태련',
  university: '경기대학교',
  dept: '컴퓨터공학부',
  sid: '23학번',
  showDept: true,
  showSid: false,
};

// 심플한 Context 없는 훅 (추후 Zustand/Jotai 교체 시 이 파일만 수정)
export function useUserStore() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  const updatePrivacy = (showDept: boolean, showSid: boolean) => {
    setUser(prev => ({ ...prev, showDept, showSid }));
  };

  /** API 연동 후 사용할 실제 author 객체 생성 */
  const getAuthor = () => ({
    realName: user.realName,
    ...(user.showDept && user.dept ? { dept: user.dept } : {}),
    ...(user.showSid && user.sid ? { sid: user.sid } : {}),
  });

  return { user, setUser, updatePrivacy, getAuthor };
}
