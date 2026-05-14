import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { BadgeIcon } from '../../components/common/BadgeIcon';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex-1 w-full max-w-sm flex flex-col items-center mt-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-extrabold text-[#3A001E] tracking-tight mb-3">
            다<span className="text-primary">걸</span>고
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wider">내이름 걸고 하는 말만</p>
        </div>
        <div className="flex flex-col items-center justify-center mt-8 space-y-6">
          <BadgeIcon className="transform hover:scale-105 transition-transform duration-300" />
          <p className="text-primary tracking-[0.2em] font-semibold text-sm lowercase mt-2">what your name?</p>
        </div>
      </div>
      <div className="mt-auto pb-8 w-full max-w-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
        <button onClick={() => navigate('/welcome')} className="w-full bg-primary text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]">
          <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          <span>대학 이메일로 시작하기</span>
        </button>
        <button onClick={() => navigate('/welcome')} className="w-full bg-white text-primary font-bold text-sm py-4 rounded-xl flex items-center justify-center space-x-3 border-2 border-pink-200 hover:bg-pink-50 transition-all active:scale-[0.98]">
          <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
          <span>이미 계정이 있어요</span>
        </button>
      </div>
    </>
  );
};
