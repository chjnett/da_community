import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, Thermometer } from 'lucide-react';

function FeatureCard({ label, title, icon }: { label: string; title: string; icon: React.ReactNode }) {
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm border border-pink-100 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(230,30,84,0.1)] transition-transform hover:scale-[1.02]">
      <div className="flex flex-col items-start gap-1">
        <span className="text-[10px] font-bold text-primary tracking-widest uppercase border border-primary/30 px-2 py-0.5 rounded-sm bg-primary/5">{label}</span>
        <h3 className="text-lg font-bold text-gray-800 mt-1">{title}</h3>
      </div>
      <div>{icon}</div>
    </div>
  );
}

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 w-full max-w-sm flex flex-col items-center mt-12 animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-[#3A001E] tracking-tight mb-3">
          다<span className="text-primary">걸</span>고
        </h1>
        <p className="text-gray-500 text-sm font-medium tracking-wider">내이름 걸고 하는 말만</p>
      </div>
      <div className="w-full space-y-4">
        <FeatureCard label="AUTHENTIC" title="실명 커뮤니티" icon={<ShieldCheck className="w-6 h-6 text-primary" strokeWidth={2} />} />
        <FeatureCard label="REFLECTION" title="AI 거울"      icon={<Sparkles    className="w-6 h-6 text-primary" strokeWidth={2} />} />
        <FeatureCard label="THERMAL"    title="대화의 온도"   icon={<Thermometer className="w-6 h-6 text-primary" strokeWidth={2} />} />
      </div>
      <div className="mt-auto pb-8 w-full flex justify-center animate-in fade-in duration-500 delay-300">
        <button onClick={() => navigate('/login')} className="text-primary font-bold text-sm hover:opacity-80 transition-opacity">
          클릭하여 시작하기
        </button>
      </div>
    </div>
  );
};
