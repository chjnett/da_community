import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../shared/api/authApi';
import { useToast } from '../../shared/ui/toast/ToastProvider';
import { toastMessages } from '../../shared/ui/toast/toastMessages';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useUserStore } from '../../store/userStore';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, clearUser } = useUserStore();
  
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleTogglePrivacy = async (key: 'isDeptOpen' | 'isSidOpen', currentVal: boolean) => {
    if (updateLoading || !user) return;
    
    setUpdateLoading(true);
    const newVal = !currentVal;
    
    try {
      const updated = await authApi.updateMe({ [key]: newVal });
      setUser(updated);
      toast.success(toastMessages.profile.updateSuccess);
    } catch (err) {
      toast.error(getUserErrorMessage(err, toastMessages.profile.updateFail));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await authApi.logout();
      clearUser(); // 스토어 비우기
      toast.success(toastMessages.auth.logoutSuccess);
      navigate('/login', { replace: true });
    } catch (err) {
      clearUser(); // 에러나도 일단 클라이언트는 로그아웃 처리
      toast.error(getUserErrorMessage(err, toastMessages.profile.logoutFail));
      navigate('/login', { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#FAFAFA] flex flex-col animate-in fade-in slide-in-from-right-8 z-50">
      <div className="px-5 py-4 flex items-center justify-between bg-[#FAFAFA]">
        <button onClick={() => navigate(-1)} className="text-[#E61E54]"><Menu className="w-6 h-6" /></button>
        <h1 className="text-[17px] font-bold text-[#E61E54]">프로필</h1>
        <button className="text-[#E61E54]"><Search className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 overflow-y-auto pb-12">
        {/* 명찰 */}
        <div className="flex justify-center mt-6 mb-12">
          <div className="relative flex flex-col items-center justify-center">
            <svg width="180" height="130" viewBox="0 0 180 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="75" y="5"  width="30" height="20" rx="4" stroke="#4A4A4A" strokeWidth="1.5" />
              <rect x="25" y="25" width="130" height="90" rx="8" stroke="#4A4A4A" strokeWidth="1.5" fill="white" />
            </svg>
            <span className="absolute top-[65px] text-4xl font-semibold text-[#1A1A1A] tracking-widest">{user?.realName ?? '...'}</span>
          </div>
        </div>

        {/* 정보 공개 수정 */}
        <div className="px-5">
          <div className="bg-[#FFF5F8] border border-[#E61E54]/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#E61E54] mb-3 text-sm">정보 공개 수정</h3>
            <div className="w-full h-px bg-[#E61E54]/30 mb-3" />
            <p className="text-[10px] font-bold text-[#E61E54] mb-5 leading-relaxed tracking-wide">
              다걸고는 실명 공개만 필수입니다<br />이외의 정보 공개는 본인 선택이에요!
            </p>
            <div className="space-y-3">
              {[
                { label: '학과 (Department)', checked: user?.isDeptOpen ?? false, toggle: () => handleTogglePrivacy('isDeptOpen', user?.isDeptOpen ?? false) },
                { label: '학번 (Student ID)',  checked: user?.isSidOpen ?? false,  toggle: () => handleTogglePrivacy('isSidOpen', user?.isSidOpen ?? false)  },
              ].map(({ label, checked, toggle }) => (
                <div
                  key={label}
                  onClick={toggle}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all shadow-sm cursor-pointer ${checked ? 'border-[#E61E54]/30 bg-white' : 'border-gray-200 bg-gray-50/50'}`}
                >
                  {checked
                    ? <CheckCircle2 className="w-5 h-5 text-[#E61E54]" fill="#E61E54" stroke="white" />
                    : <CheckCircle2 className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                  }
                  <span className={`text-[13px] font-bold ${checked ? 'text-[#E61E54]' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 mt-5">
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full py-3 rounded-xl border border-red-200 bg-white text-red-500 text-sm font-bold hover:bg-red-50 disabled:opacity-60"
          >
            {logoutLoading ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
    </div>
  );
};
