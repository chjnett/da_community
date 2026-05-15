# 🎨 Frontend Developer Handover (프론트엔드 인수인계)

## 1. 프로젝트 개요
본 프론트엔드(`apps/web`)는 경기대학교 익명 커뮤니티 '다걸고'의 사용자 인터페이스를 담당합니다. React 18과 TypeScript를 기반으로 하며, 모바일 웹 환경 최적화에 집중하고 있습니다.

## 2. 디렉토리 구조 및 역할
- `src/app`: 전역 설정 (Router, Providers)
- `src/pages`: 페이지 단위 컴포넌트 (Feed, PostDetail, Profile 등)
- `src/components`: 재사용 가능한 공통 UI 컴포넌트
- `src/shared/api`: API 클라이언트, Zod 스키마 (`contracts.ts`), 토큰 관리
- `src/shared/store`: Zustand 상태 정의 (`userStore.ts`)
- `src/features`: 특정 도메인 로직 (Chat, Auth 등)

## 3. 핵심 기술 스택 및 데이터 흐름

### 3.1 상태 관리 (Zustand & React Query)
- **Client State**: `Zustand`를 통해 로그인 여부 및 사용자 기본 정보를 유지합니다.
- **Server State**: `React Query`를 사용하여 API 데이터를 캐싱합니다.
  - 키 규칙: `['posts', boardId]`, `['post', postId]`, `['replies', postId]`
  - 가급적 `staleTime`을 활용하여 불필요한 재요청을 방지합니다.

### 3.2 API 통신 규격 (`src/shared/api`)
- **`httpClient.ts`**: 모든 요청은 `apiRequest<T>` 함수를 거칩니다.
- **인증**: 요청 헤더에 `Authorization: Bearer <Access_Token>`이 자동으로 포함됩니다.
- **검증**: `contracts.ts`의 Zod 스키마를 사용하여 API 응답의 타입을 런타임에서 보장합니다.

### 3.3 실시간 채팅 연동 (`src/features/chat`)
- `ChatSocketManager` 클래스가 WebSocket 생명주기를 관리합니다.
- AI 백엔드(8000 포트)와 직접 통신하며, 메시지 수신 시 Zustand 스토어나 로컬 상태를 업데이트합니다.

## 4. 환경 설정 및 실행

### 4.1 환경 변수 설정 (.env)
프론트엔드 구동 전 백엔드 주소를 설정해야 합니다.
```bash
cd apps/web
cp .env.example .env
```
- **필수 설정 항목**:
  - `VITE_API_URL`: `worker-api` 주소 (예: `http://localhost:8787/api/v1`)
  - `VITE_WS_URL`: `ai-backend` WebSocket 주소 (예: `ws://localhost:8000/ws/chat`)

### 4.2 설치 및 실행
```bash
npm install
npm run dev
```

## 5. 차기 작업 과제 (Roadmap)
- [ ] **이미지 최적화**: 업로드 시 클라이언트 측 압축 및 R2 저장소 연동 UI 개선.
- [ ] **에러 바운더리**: API 실패 시 사용자에게 친숙한 Fallback UI 제공.
- [ ] **Skeleton UI**: 데이터 로딩 중 레이아웃 흔들림 방지를 위한 스켈레톤 적용.


---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
