# Auth E2E Checklist

## Precondition
- Worker API 실행 중
- `apps/web/.env.local`에 `VITE_API_BASE_URL`, `VITE_WS_BASE_URL` 설정 완료

## Case 1: 로그인 보호 라우트
1. 토큰 없는 상태에서 `/feed` 직접 접근
2. 기대 결과: `/login`으로 리다이렉트

## Case 2: 정상 로그인
1. `/login`에서 로그인 요청 성공
2. 기대 결과: `/feed` 이동 + 보호 라우트 접근 가능

## Case 3: 토큰 만료 + refresh 성공
1. accessToken 만료 상태에서 보호 API 호출
2. 기대 결과: refresh 후 요청 자동 재시도 성공

## Case 4: 토큰 만료 + refresh 실패
1. refreshToken 무효화 상태에서 보호 API 호출
2. 기대 결과:
- 토큰 정리
- 토스트: `세션이 만료되어 다시 로그인해주세요.`
- `/login` 이동

## Case 5: 수동 로그아웃
1. `/profile/settings`의 로그아웃 버튼 클릭
2. 기대 결과:
- 토큰 정리
- `/login` 이동
- 보호 라우트 재접근 시 차단


---

## 2026-05-16 업데이트

- Worker 인증 흐름 안정화: `POST /api/v1/auth/refresh` 라우트 추가(토큰 갱신 404 해결)
- 알림 API 안정화: D1 어댑터 `notifications` 메서드 보강 + 마이그레이션 반영
- 프로필/통계 호환성: `/api/v1/auth/me` 응답에 `id` 포함, `/api/v1/stats/me` 레거시 경로 호환 추가
- AI 검토 정책 강화: 욕설 외 비난/조롱/낙인성 표현까지 `SOFT_WARN/BLOCK` 범위 확장
- 작성 UX 개선: 경고/차단 시 `수정하기`와 `그래도 올리기(forcePublish)` 선택 가능
- 운영 점검 결과: Railway AI 백엔드는 응답 중이나, OpenAI 키 실사용 여부는 Railway 최신 배포/환경변수 확인이 필요
