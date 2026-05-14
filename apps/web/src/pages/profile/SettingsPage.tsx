import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [deptOpen, setDeptOpen] = useState(true);
  const [sidOpen,  setSidOpen]  = useState(false);

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
            <span className="absolute top-[65px] text-4xl font-semibold text-[#1A1A1A] tracking-widest">이태련</span>
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
                { label: '학과 (Department)', checked: deptOpen, toggle: () => setDeptOpen(p => !p) },
                { label: '학번 (Student ID)',  checked: sidOpen,  toggle: () => setSidOpen(p => !p)  },
              ].map(({ label, checked, toggle }) => (
                <div
                  key={label}
                  onClick={toggle}
                  className="flex items-center space-x-3 p-3 rounded-xl border border-[#E61E54]/30 bg-white cursor-pointer transition-colors shadow-sm"
                >
                  {checked
                    ? <CheckCircle2 className="w-5 h-5 text-[#E61E54]" fill="#E61E54" stroke="white" />
                    : <CheckCircle2 className="w-5 h-5 text-[#E61E54]/40" strokeWidth={1.5} />
                  }
                  <span className={`text-[13px] font-bold ${checked ? 'text-[#E61E54]' : 'text-[#E61E54]/70'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
