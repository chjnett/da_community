import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { BadgeIcon } from '../../components/common/BadgeIcon';
import { authApi } from '../../shared/api/authApi';
import { tokenStorage } from '../../shared/api/tokenStorage';
import { getUserErrorMessage } from '../../shared/errors/getUserErrorMessage';
import { useUserStore } from '../../store/userStore';

type AuthMode = 'signup' | 'login';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [dept, setDept] = useState('');
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidSchoolEmail = useMemo(() => /@kyonggi\.ac\.kr$/i.test(email.trim()), [email]);
  const canSubmit =
    mode === 'login'
      ? email.trim().length > 0 && password.trim().length > 0
      : email.trim().length > 0 &&
        password.trim().length > 0 &&
        realName.trim().length > 0 &&
        isValidSchoolEmail;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 테스트 모드: 즉시 더미 세션 주입 및 이동
    useUserStore.getState().setUser({
      realName: realName.trim() || "테스트유저",
      university: "경기대학교",
      dept: dept.trim() || "컴퓨터공학부",
      sid: sid.trim() || "20231234",
      isDeptOpen: true,
      isSidOpen: true,
    });

    tokenStorage.setTokens({
      accessToken: "dummy_token",
      refreshToken: "dummy_token"
    });

    navigate('/feed', { replace: true });
    setLoading(false);
  };

  return (
    <>
      <div className="flex-1 w-full max-w-sm flex flex-col items-center mt-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-extrabold text-[#3A001E] tracking-tight mb-3">
            다<span className="text-primary">걸</span>고
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wider">내이름 걸고 하는 말만</p>
        </div>
        <div className="w-full rounded-2xl border border-pink-100 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-primary text-white' : 'bg-pink-50 text-primary'}`}
            >
              회원가입
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-primary text-white' : 'bg-pink-50 text-primary'}`}
            >
              로그인
            </button>
          </div>

          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="학교 이메일 (@kyonggi.ac.kr)"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="비밀번호"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />

          {mode === 'signup' ? (
            <>
              <input
                value={realName}
                onChange={e => setRealName(e.target.value)}
                type="text"
                placeholder="실명"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                value={dept}
                onChange={e => setDept(e.target.value)}
                type="text"
                placeholder="학과 (선택)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                value={sid}
                onChange={e => setSid(e.target.value)}
                type="text"
                placeholder="학번 (선택)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              {!isValidSchoolEmail && email.trim().length > 0 ? (
                <p className="text-xs text-red-500 font-medium">경기대학교 이메일만 가입할 수 있어요.</p>
              ) : null}
            </>
          ) : null}

          {error ? <p className="text-xs text-red-500 font-medium">{error}</p> : null}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${!loading ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}
          >
            {loading ? '처리 중...' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mt-6 space-y-2">
          <BadgeIcon className="w-16 h-16" />
          <p className="text-primary tracking-[0.2em] font-semibold text-[11px] lowercase">what your name?</p>
        </div>
      </div>
      <div className="mt-auto pb-8 w-full max-w-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
        <button onClick={() => navigate('/welcome')} className="w-full bg-primary text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]">
          <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          <span>온보딩 화면 보기</span>
        </button>
        <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="w-full bg-white text-primary font-bold text-sm py-4 rounded-xl flex items-center justify-center space-x-3 border-2 border-pink-200 hover:bg-pink-50 transition-all active:scale-[0.98]">
          <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
          <span>{mode === 'signup' ? '이미 계정이 있어요' : '처음이신가요?'}</span>
        </button>
        <button 
          onClick={() => {
            tokenStorage.resetAll();
            window.location.reload();
          }}
          className="text-center text-[11px] text-gray-400 mt-2 underline underline-offset-2"
        >
          앱 데이터 및 캐시 초기화 (오류 발생 시 클릭)
        </button>
      </div>
    </>
  );
};
