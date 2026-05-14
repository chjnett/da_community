import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { BadgeIcon } from '../../components/common/BadgeIcon';

export const PrivacySetPage: React.FC = () => {
  const navigate = useNavigate();
  const [deptChecked, setDeptChecked] = useState(true);
  const [sidChecked, setSidChecked]   = useState(true);

  return (
    <>
      <div className="flex-1 w-full max-w-sm flex flex-col items-center mt-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <BadgeIcon showText className="w-24 h-24" />
          <p className="text-primary tracking-[0.2em] font-semibold text-[10px] lowercase">what your name?</p>
        </div>
        <div className="w-full text-center mb-6">
          <h2 className="text-lg font-extrabold text-[#3A001E] tracking-tight mb-3">공개할 정보를 직접 선택해주세요</h2>
          <div className="w-full h-[1.5px] bg-pink-200 mb-4" />
          <p className="text-primary/80 text-xs font-bold leading-relaxed">
            다걸고는 실명 공개만 필수입니다.<br/>이외의 정보 공개는 본인 선택이에요!
          </p>
        </div>
        <div className="w-full bg-white/60 border border-pink-200 rounded-2xl p-6 space-y-5">
          {/* 실명 – 필수 */}
          <div className="flex items-center space-x-3 cursor-not-allowed">
            <CheckCircle2 className="w-5 h-5 text-primary fill-pink-50" strokeWidth={2} />
            <span className="text-sm font-bold text-[#3A001E]">실명 (Name) <span className="text-[10px] text-primary ml-1">(필수)</span></span>
          </div>
          <div className="w-full h-[1.5px] bg-pink-100/50" />
          {/* 학과 – 선택 */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setDeptChecked(p => !p)}>
            <CheckCircle2 className={`w-5 h-5 transition-colors ${deptChecked ? 'text-primary fill-pink-50' : 'text-gray-300 fill-gray-100 group-hover:text-pink-300'}`} strokeWidth={2} />
            <span className={`text-sm font-bold transition-colors ${deptChecked ? 'text-primary' : 'text-gray-400 group-hover:text-pink-400'}`}>
              학과 (Department) <span className="text-[10px] ml-1 font-normal opacity-70">(선택)</span>
            </span>
          </div>
          <div className="w-full h-[1.5px] bg-pink-100/50" />
          {/* 학번 – 선택 */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setSidChecked(p => !p)}>
            <CheckCircle2 className={`w-5 h-5 transition-colors ${sidChecked ? 'text-primary fill-pink-50' : 'text-gray-300 fill-gray-100 group-hover:text-pink-300'}`} strokeWidth={2} />
            <span className={`text-sm font-bold transition-colors ${sidChecked ? 'text-primary' : 'text-gray-400 group-hover:text-pink-400'}`}>
              학번 (Student ID) <span className="text-[10px] ml-1 font-normal opacity-70">(선택)</span>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto pb-8 w-full max-w-sm flex flex-col">
        <button onClick={() => navigate('/loading')} className="w-full bg-white text-primary font-bold text-sm py-4 rounded-xl border-2 border-primary hover:bg-pink-50 transition-all active:scale-[0.98]">
          동의하고 시작하기
        </button>
      </div>
    </>
  );
};
