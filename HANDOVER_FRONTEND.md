# 🎨 Frontend Developer Handover (프론트엔드 인수인계)

## 1. 아키텍처 및 상태 관리
- **프레임워크**: React + Vite (TypeScript)
- **상태 관리**: `Zustand` (`userStore.ts`)를 사용하여 사용자 인증 상태를 전역 관리합니다.
- **데이터 패칭**: `React Query` (TanStack Query v5)를 사용하며, 캐시 키는 `['post', postId]` 형식을 따릅니다.

## 2. API 연동 가이드 (`src/shared/api`)
- **`httpClient.ts`**: `apiRequest` 함수를 통해 모든 통신이 이루어집니다. 8787 포트(Worker API)를 기본 BaseURL로 사용합니다.
- **Zod 스키마**: `contracts.ts`에 정의된 Zod 스키마를 통해 런타임 데이터 검증을 수행합니다.
- **인증 토큰**: Access/Refresh 토큰은 `tokenStorage.ts`를 통해 로컬 스토리지에 자동 관리됩니다.

## 3. 실시간 통신 (WebSocket)
- **`socketManager.ts`**: `ChatSocketManager` 클래스를 통해 실시간 채팅방 연결을 관리합니다.
- **주소 설정**: 개발 시에는 8000 포트(FastAPI)의 `/ws/chat/{roomId}`로 자동 연결됩니다.

## 4. 현재 구현된 핵심 UI
- **`CampusFeedPage`**: 게시판 통합 리스트 및 카운트 표시.
- **`PostDetailPage`**: 게시글 상세, 좋아요 토글, 답글 리스트 연동.
- **`ProfilePage`**: 사용자 활동 통계(글/답글 수) 연동 및 명찰 디자인 적용.

## 5. 차기 작업 과제 (Next Tasks)
- [ ] **반응형 보완**: 모바일 뷰 최적화 및 안드로이드/iOS 웹뷰 대응.
- [ ] **이미지 갤러리**: 게시글 내 다중 이미지 슬라이더 구현.
- [ ] **낙관적 업데이트**: 좋아요 클릭 시 UI 즉시 반영 로직 보강.
