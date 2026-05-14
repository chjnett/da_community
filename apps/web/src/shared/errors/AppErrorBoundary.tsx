import React from "react";

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 w-full h-full bg-white flex flex-col items-center justify-center px-6 text-center">
          <h2 className="text-xl font-extrabold text-[#3A001E] mb-3">화면 오류가 발생했어요</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            잠시 후 다시 시도해주세요. 문제가 계속되면 앱을 새로고침하면 대부분 해결돼요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

