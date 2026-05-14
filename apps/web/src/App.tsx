// ============================================================
// App.tsx — 모바일 프레임 컨테이너 + 라우터 루트
// 이제 App.tsx는 '모바일 쉘(Shell)' 역할만 담당
// ============================================================
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './routes/Router';
import { ToastProvider } from './shared/ui/toast/ToastProvider';
import { AppErrorBoundary } from './shared/errors/AppErrorBoundary';
import { AuthSessionListener } from './shared/auth/AuthSessionListener';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/api/queryClient';

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthSessionListener />
          {/* 모바일 중심 프레임: PC에서는 스마트폰 모양, 모바일에서는 풀스크린 */}
          <div className="min-h-[100dvh] w-full bg-gray-100 flex justify-center sm:py-8 font-sans">
            <div className="w-full max-w-[430px] bg-white relative overflow-hidden sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-900 sm:shadow-2xl flex flex-col h-[100dvh] sm:h-[850px]">
              {/* 온보딩(1~5) 화면의 배경 그라디언트 래퍼 */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white via-white to-pink-50 flex flex-col items-center px-6 py-12 overflow-y-auto">
                <AppRouter />
              </div>
            </div>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
  );
}

export default App;
