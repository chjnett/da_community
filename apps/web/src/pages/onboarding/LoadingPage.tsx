import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeIcon } from '../../components/common/BadgeIcon';

export const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div
      className="flex-1 w-full max-w-sm flex flex-col items-center justify-center animate-in fade-in duration-1000 cursor-pointer"
      onClick={() => navigate('/feed')}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        <BadgeIcon showText className="animate-pulse duration-1000" />
        <p className="text-primary tracking-[0.2em] font-semibold text-sm lowercase mt-2 animate-pulse duration-1000">
          what your name?
        </p>
      </div>
    </div>
  );
};
