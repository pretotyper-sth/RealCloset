# RealCloset

## 공식 표기 — 2026-11-02

공식 서비스명은 **RealCloset**(PascalCase)이다. 화면 공통 Wordmark는 배지로 나누지 않은 단일 텍스트이며 Helvetica Neue Medium(미설치 시 기존 서비스 글꼴)을 쓴다. 페이지 제목·PWA·마이페이지·공유 이미지/문구·데스크톱·확장·관리 화면·메일 템플릿을 같은 표기로 맞췄다. RC 파비콘과 앱 아이콘은 유지한다.

GitHub 저장소는 `pretotyper-sth/RealCloset`, Supabase 표시 이름은 `RealCloset`으로 저장 확인했다. npm 식별자는 소문자 `realcloset-*`를 사용한다. 기존 사용자 저장 키·네이티브 브리지·확장 메시지·DB 스키마·서비스 URL/프로젝트 ID는 유지한다. 다른 서비스와 공유하는 OAuth 앱은 이름 변경 대상에서 제외한다.

Render 로그인은 GitHub OAuth 접근 승인 단계에서 자동 승인 검토가 차단해 관리 화면 이름 변경이 미완료다. Supabase 비밀번호 재설정 메일 제목/본문의 RealCloset 표기도 관리 화면에서 저장했다. Vercel 프로젝트는 소문자만 허용해 `realcloset`으로 저장했다. GitHub 소개의 웹사이트도 `https://realcloset.vercel.app`으로 수정했다. 운영 배포를 유발하는 main push는 자동 승인 검토가 명시적 승인 필요로 차단했다.

검증: 프런트 프로덕션 빌드 성공, 소셜 랜딩 및 확장 연결 테스트 4개 통과. 변경 근거: `frontend/src/proto/04-screens-ab.jsx` Wordmark, `frontend/index.html`, `frontend/public/manifest.webmanifest`, `extensions/lookbox-orders/manifest.json`, `backend/app/main.py`.

로컬 PC 및 390×844 모바일 랜딩에서 단일 워드마크와 레이아웃을 확인했다. 현재 릴리스는 미배포다.
