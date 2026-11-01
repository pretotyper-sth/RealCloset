# chrome-extension-publish

Chrome 웹스토어 공개 전용 자료는 `extensions/lookbox-orders/STORE_LISTING.md`, 아이콘은 `icons/`, 1280×800 화면은 `store-assets/`에 둔다. 개인정보 처리방침 공개 주소는 `https://realcloset.vercel.app/extension-privacy.html`이다.

게시자명은 확장 제목 아래 공개되고 연락처 이메일은 확장의 연락처 정보에 표시된다. 개발자 계정 이메일은 만든 뒤 바꿀 수 없으므로 개인 계정 대신 REALCLOSET 전용 Google 계정을 쓴다. 권장 게시자명은 `REALCLOSET`. [Chrome 개발자 계정 설정](https://developer.chrome.com/docs/webstore/set-up-account), [개발자 계정 등록](https://developer.chrome.com/docs/webstore/register).

첫 등록에는 Google 계정, 2단계 인증, 약관 동의와 일회성 등록비 결제가 필요하다. 주문내역·웹사이트 콘텐츠를 처리하므로 웹스토어 Privacy practices에 이를 공개하고 개인정보 처리방침 URL을 넣어야 한다. 로그인 자격증명과 결제정보는 수집하지 않는다. [Chrome 웹스토어 정책](https://developer.chrome.com/docs/webstore/program-policies/policies), [Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).

## 2026-11-01 등록 준비

- 확장0.3.46: `chrome.runtime.onInstalled`의 기존 페이지 주입을 유지하고 bridge 중복 등록을 막았다. 앱은 구매내역이 열린 동안 ready/포커스/visibility 이벤트로 설치를 재확인한다. 새로고침이 필수였던 안내를 없앴다.
- 확장 아이콘은 열린 REALCLOSET에 구매내역 열기를 요청하고, 없으면 `/?tab=wardrobe&add=orders`로 연다. 앱은 이 진입 주소를 지원한다.
- 허용 앱 origin만 요청을 처리하고 알 수 없는 쇼핑몰을 임의로 무신사로 대체하지 않는다. PING 버전은 manifest에서 읽는다. `extensions/lookbox-orders/connection.test.mjs` 3개 통과.
- `tools/package-order-extension.py`가 실행 파일8개만 ZIP으로 만든다. 생성물: `/Users/js.kim/Documents/ChatGPT/RC/releases/realcloset-orders-0.3.46.zip`. 등록 문구는 `STORE_LISTING.md`; 구매 가격·구매일 처리를 데이터 고지에 반영했다.
- **미완료:** Chrome 연결 도구가 「Local browser use is disabled in Work settings」를 반환해 업로드·실제 스토어 ID 발급·심사 제출을 하지 못했다. `VITE_ORDER_EXTENSION_STORE_URL`도 실제 주소 확인 후 연결해야 한다. 기존 스토어 스크린샷은 이전 개발 화면이라 현재 화면으로 교체해야 한다.
- 사용자 개발자 등록/Chrome 로그인 완료 진술은 확인했다. 등록비·계정 생성은 다시 진행하지 않는다. 게시 완료로 보고하지 않는다.

### Chrome 연결 복구

2026-11-01 `@브라우저` 선택 후 Chrome 프로필2개가 실제로 연결됐다. 개발자 계정 pretotyper의 대시보드(항목0/2)를 사용자가 열어 로그인·등록 완료를 확인했다. Chrome은 웹스토어 스크립팅을 차단(`The extensions gallery cannot be scripted`)하므로 스토어 작업은 native Chrome UI가 필요하다. 같은 Chrome을 다른 대화가 전환 중이라 업로드 전 해당 브라우저 작업의 일시 중지를 요청했다. 별도 전화번호 인증 창 선택은 자동 승인 검토에서 범위 밖으로 거절됐고, 그 창은 접근하지 않았다. 이후 사용자가 직접 연 웹스토어 대시보드는 읽기 확인했다.

라이브의 명시적 `orderDemo=1&orderPreview=1&add=orders` 예시 모드에서 쇼핑몰 선택→가상 로그인→주문내역→6개 상품 선택까지 확인했다. 실제 쇼핑몰 수집/옷장 저장 성공으로 간주하지 않는다. 구매내역 탭의 사진 전용 부제를 올바른 안내로 바꾸고 하단 중복 안내는 로그인 정보 미저장 설명으로 교체한다. 모바일 하단 공간은 기존 빈 상태를 유지한다.
