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

