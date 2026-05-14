// ============================================================
// routes/Router.tsx — 앱 전체 라우터 (React Router v6)
// 향후 React Native로 전환 시 이 파일만 교체하면 됨
// ============================================================
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Onboarding
import { SplashPage }      from '../pages/onboarding/SplashPage';
import { LoginPage }       from '../pages/onboarding/LoginPage';
import { WelcomePage }     from '../pages/onboarding/WelcomePage';
import { PrivacySetPage }  from '../pages/onboarding/PrivacySetPage';
import { LoadingPage }     from '../pages/onboarding/LoadingPage';

// Feed & Boards
import { CampusFeedPage }  from '../pages/feed/CampusFeedPage';
import { BoardListPage }   from '../pages/feed/BoardListPage';
import { BoardDetailPage } from '../pages/feed/BoardDetailPage';

// Post
import { PostDetailPage }  from '../pages/post/PostDetailPage';
import { WritePostPage }   from '../pages/post/WritePostPage';
import { WriteReplyPage }  from '../pages/post/WriteReplyPage';

// Shared
import { SearchPage }      from '../pages/shared/SearchPage';
import { NoticePage }      from '../pages/shared/NoticePage';

// Profile
import { ProfilePage }     from '../pages/profile/ProfilePage';
import { SettingsPage }    from '../pages/profile/SettingsPage';
import { CategoryPage }    from '../pages/shared/CategoryPage';

export const AppRouter: React.FC = () => (
  <Routes>
    {/* 온보딩 */}
    <Route path="/"           element={<SplashPage />} />
    <Route path="/login"      element={<LoginPage />} />
    <Route path="/welcome"    element={<WelcomePage />} />
    <Route path="/privacy"    element={<PrivacySetPage />} />
    <Route path="/loading"    element={<LoadingPage />} />

    {/* 메인 탭 */}
    <Route path="/feed"       element={<CampusFeedPage />} />
    <Route path="/boards"          element={<BoardListPage />} />
    <Route path="/categories"      element={<CategoryPage />} />
    <Route path="/boards/:boardId" element={<BoardDetailPage />} />

    {/* 게시글 */}
    <Route path="/posts/:postId"       element={<PostDetailPage />} />
    <Route path="/posts/write"         element={<WritePostPage />} />
    <Route path="/posts/:postId/reply" element={<WriteReplyPage />} />

    {/* 공유 */}
    <Route path="/search"    element={<SearchPage />} />
    <Route path="/notice"    element={<NoticePage />} />

    {/* 프로필 */}
    <Route path="/profile"          element={<ProfilePage />} />
    <Route path="/profile/settings" element={<SettingsPage />} />

    {/* 기타 → 홈으로 */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
