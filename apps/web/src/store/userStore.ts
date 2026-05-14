import { create } from 'zustand';
import type { UserProfile } from '../types';

interface UserState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updatePrivacy: (key: 'isDeptOpen' | 'isSidOpen', value: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  updatePrivacy: (key: 'isDeptOpen' | 'isSidOpen', value: boolean) =>
    set((state) => ({
      user: state.user ? { ...state.user, [key]: value } : null
    })),

  clearUser: () => set({ user: null }),
}));

/** API 연동 후 사용할 실제 author 객체 추출을 위한 헬퍼 */
export const getAuthorFromUser = (user: UserProfile | null) => {
  if (!user) return null;
  return {
    realName: user.realName,
    ...(user.isDeptOpen && user.dept ? { dept: user.dept } : {}),
    ...(user.isSidOpen && user.sid ? { sid: user.sid } : {}),
  };
};
