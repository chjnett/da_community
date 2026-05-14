// ============================================================
// components/common/BottomNav.tsx — 하단 탭 네비게이션
// Figma 디자인에 맞춰 3개 탭(캠퍼스, 알림, 프로필)으로 구성
// ============================================================
import React from 'react';
import { Home, Bell, UserCircle2 } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const TABS = [
  { path: '/feed',    icon: Home,        label: '캠퍼스' },
  { path: '/notice',  icon: Bell,        label: '알림'   },
  { path: '/profile', icon: UserCircle2, label: '프로필' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, navigate }) => (
  <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex items-center justify-around py-3 pb-6 z-40">
    {TABS.map(({ path, icon: Icon, label }) => {
      const isActive = currentPath.startsWith(path) || (path === '/feed' && currentPath === '/categories');
      return (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`flex flex-col items-center space-y-1 transition-colors ${isActive ? 'text-[#E61E54]' : 'text-gray-400'}`}
        >
          <Icon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{label}</span>
        </button>
      );
    })}
  </div>
);
