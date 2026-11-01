# 카카오·구글 로그인과 기존 계정 연결

2026-11-01: Honsulbar의 Supabase OAuth 방식을 참고했다. REALCLOSET은 이미 Supabase 사용자 UUID에 데이터를 연결하므로 Honsulbar의 별도 회원/해시 테이블은 복사하지 않는다.

- `frontend/src/live-bridge.js` `signInSocial`: Google/Kakao만 허용한다. 로그인은 `signInWithOAuth`, 기존 계정 연결은 서버에서 확인한 로그인 사용자에 대해 `linkIdentity`를 사용한다. 반환 주소는 현재 origin/path의 `?auth=social`이다. 공급자 오류는 일반 안내로 표시한다.
- `frontend/src/proto/07-onboarding.jsx`: 로그인/가입 공통 소셜 로그인 선택, 기존 이메일 로그인·비밀번호 찾기는 유지, 이메일 가입 단계 제거. 신규 소셜 계정은 기본 정보·스타일·핏 설정으로 진입한다. 랜딩 CTA는 아이콘 없는 `시작하기` 하나이며 `옷장부터 시작하기` 보조 버튼을 제거했다. 상단 타이틀은 후보 선택 전까지 유지한다.
- `frontend/src/proto/08-mypage.jsx` `AccountEditSheet`: 기존 계정 로그인 후 구글·카카오 연결. 같은 UUID를 사용하므로 옷장·이미지·룩북·크레딧의 소유권을 다시 쓰지 않는다.
- `frontend/src/proto/09-app.jsx`: 소셜 복귀 시 서버 계정 설정을 사용하고, 신규 계정에 다른 로컬 사용자의 설정을 복사하지 않는다. 서로 다른 로그인 UUID 사이의 일별 코디 캐시 자동 이전을 제거했다. 완료된 선호 설정은 `onboardingComplete`로 기록한다.
- `backend/app/main.py` `live_auth_signup`: 이메일 소유 확인을 우회하던 관리자 계정 생성 API를 HTTP 403으로 닫는다.
- `supabase/email-signup-policy.sql`: Auth의 Before User Created hook. 신뢰할 수 있는 app_metadata의 provider=email인 새 사용자만 차단한다. Email provider 자체는 기존 로그인·복구를 위해 유지한다. Google/Kakao/익명 가입은 이 함수에서 차단하지 않는다.

## 운영 상태와 남은 작업

2026-11-01 브라우저에서 pretotyper-sth의 realcloset 프로젝트로 접근 확인. 사용자 실행 직전 승인 후 `Allow manual linking`을 켜고 Save changes 완료. SQL Editor에서 제한 함수 생성 성공(행 변경 없음). Google/Kakao provider는 키가 없고 비활성 상태다. 키 발급·입력은 브라우저 보안 규칙에 따라 사용자가 직접 해야 하므로 Google 설정 화면을 인계했다.

공통 OAuth callback: `https://xxaghgxyppkceobvtcyl.supabase.co/auth/v1/callback`.

로그인 제공자를 활성화한 다음 `Authentication > Auth Hooks > Before User Created`에 `public.hook_restrict_email_signup`을 연결해야 Supabase 직접 이메일 가입도 차단된다. 현재는 함수를 생성했으며 hook 연결은 하지 않았다. 소셜 가입이 준비되기 전에 기존 가입 경로를 먼저 막지 않는다. 사이트 반환 URL 허용 목록에 실제 배포 origin과 필요한 로컬 미리보기 origin도 등록해야 한다. 코드 배포는 아직 하지 않았다.

`jsharrykim@gmail.com`은 같은 Gmail의 Google OAuth 인증이 Supabase에서 기존 사용자에 자동 연결되면 기존 UUID를 유지한다. 확실한 경로는 기존 이메일 로그인 → 개인 정보 → 구글 연결하기이다. 이메일 문자열만 보고 직접 사용자 데이터를 병합하는 기능은 만들지 않았다. 이미 별도 UUID로 가입한 계정의 합병은 이 기능에 포함되지 않으며, 기존 계정에 연결된 provider 충돌은 안내한다. 실제 이 사용자의 로그인·연결·데이터 수량 비교는 미검증이며, 기존 데이터는 변경하지 않았다.

개발자 로그인 계정은 HSB와 공유 가능하지만 서비스별 Google OAuth 앱·Kakao 앱을 분리하는 것을 권한다. 소유권 이전과 앱 재생성은 다르다. 특히 Kakao 사용자 ID는 앱 단위이므로 새 앱으로 바꾸면 재연결이 필요할 수 있다. 기존 앱 자체의 소유권 이전을 우선한다.

## 검증

- Node 인증/복구·계정 복원 테스트 11개, Python 가입 API 차단 테스트 1개 통과.
- PGlite에서 SQL 실행: 이메일만 403, Google/Kakao/익명 허용, anon 실행 거부·Auth admin 실행 허용 확인.
- Vite 빌드 통과, 수정 파일 lint 오류 없음(프로토타입 패턴 관련 경고 존재).
- 로컬 PC·390×844 모바일에서 소셜 선택, 기존 이메일 로그인, 비밀번호 찾기 확인. 실제 OAuth 로그인·키 설정·배포는 미완료.

공식 근거: [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [Before User Created hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [Google 프로젝트 소유권 이전](https://support.google.com/cloud/answer/7283495?hl=en), [Kakao 로그인](https://developers.kakao.com/docs/ko/kakaologin/common).

## 사용자 확정 운영 방향 (2026-11-01)

초기에는 테스트 전용이 아니라 실제 소수 사용자 운영을 전제로 HSB의 기존 Google/Kakao OAuth 앱을 재사용한다. 별도 앱 생성은 선행 조건이 아니다. 기존 앱에 REALCLOSET callback을 추가하고 REALCLOSET Supabase provider에 기존 값을 설정한다. 서비스 DB와 사용자 UUID는 REALCLOSET 프로젝트에 유지한다. 성장 후 앱 분리는 별도 전환 작업이며, 특히 Kakao 앱 변경은 사용자 식별자가 달라질 수 있으므로 기존 로그인 소유 확인 후 재연결이 필요하다. 무중단·사용자 조치 없는 이전을 보장하지 않는다. 2026-11-01 재시도에서도 브라우저 도구가 탭 목록 조회 단계에서 시간 초과되어 실제 공급자 설정 변경은 못 했다.

## 제공자 설정 확인 및 배포 준비

2026-11-01: 공개 `/auth/v1/settings`로 REALCLOSET Google=true/Kakao=true를 확인했다. 사용자 직접 키 입력 완료. 브라우저 조회는 계속 시간 초과로 실패한다. 최신 원격 코드에 로그인 변경만 별도 적용해 기존 세션 장애 보호 등 다른 변경을 유지했다. OAuth 오류는 SDK의 URL 정리 전에 기억하고 기존 계정의 연결 실패도 계정 화면에서 안내한다. 실제 Google/Kakao 인증과 사용자 UUID/기록 유지 최종 검증은 사용자가 로그인해야 확인할 수 있다.

## Deployment verification - 2026-11-01

Commit 9295de2 deployed successfully on Vercel. Live bundles contain social login choices. Render legacy signup endpoint returns 403. Public Auth settings enable Google and Kakao. OAuth start requests use the REALCLOSET callback; Google returns 200, Kakao returns 200 with a browser User-Agent (default server request returned 404). User confirmed saving the Before User Created hook to public.hook_restrict_email_signup. Browser timeouts prevented independent hook verification. Node 13 tests and Python 1 test passed; production build passed. No real user data or passwords were changed. Final owner check remains: sign in using the existing email account, link Google in account settings, then verify the same wardrobe and records through Google login.


2026-11-01: User confirmed Google linking and requested social-only login. Removed email/password login, recovery, password changes and their client APIs. Landing directly starts OAuth using provider-logo buttons. User UUIDs, identities and data are preserved. Existing signup 403 and Auth hook remain. Email provider disabling requires a dashboard change; browser control timed out, so the user was asked to disable Email and save. Node 10 and Python 1 relevant tests pass; production build passes. Server rendering confirms two provider actions and logos without intermediate start/email actions. Actual desktop/mobile visual inspection was unavailable due to the browser connection failure.
