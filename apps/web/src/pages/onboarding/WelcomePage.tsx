import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeIcon } from '../../components/common/BadgeIcon';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center -mt-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center space-y-6 mb-16">
          <BadgeIcon showText className="transform hover:scale-105 transition-transform duration-300" />
          <p className="text-primary tracking-[0.2em] font-semibold text-sm lowercase mt-2">what your name?</p>
        </div>
        <div className="text-center w-full px-4">
          <h2 className="text-2xl font-extrabold text-[#3A001E] tracking-tight mb-6">이름을 걸고 말하는 공간</h2>
          <p className="text-primary/90 text-[13px] leading-[1.8] font-bold">
            다걸고는 투명한 소통과 책임 있는 대화를 지향합니다.<br/>
            모든 구성원은 본인의 실명을 바탕으로 소통하며<br/>
            익명성 뒤에 숨지 않는 당당한 문화를 함께 만들어갑니다
          </p>
        </div>
      </div>
      <div className="mt-auto pb-8 w-full max-w-sm">
        <button onClick={() => navigate('/privacy')} className="w-full h-12 flex justify-center items-center text-primary/30 font-semibold text-xs hover:text-primary transition-colors">
          화면을 클릭하여 다음으로
        </button>
      </div>
    </>
  );
};
