# REALCLOSET 구매내역 확장

로그인된 Chrome의 쇼핑몰 주문내역에서 상품을 읽어 REALCLOSET 선택 화면에 전달한다.
아이디·비밀번호·인증 쿠키 값과 카드·계좌번호는 읽거나 저장하지 않는다.

## 사용자 설치 흐름

1. REALCLOSET → 아이템 추가 → 구매내역에서 **확장 프로그램 설치하기**를 누른다.
2. Chrome 웹스토어에서 설치한 뒤 REALCLOSET으로 돌아온다. 새로고침 없이 연결을 확인한다.
3. 쇼핑몰 선택 → 주문내역 가져오기 → 필요한 경우 쇼핑몰 로그인 → 담을 옷 선택.

Chrome 도구 모음의 확장 아이콘으로도 구매내역 화면을 열 수 있다.
웹스토어 공개 주소는 `VITE_ORDER_EXTENSION_STORE_URL`로 연결한다. 새 항목을 업로드해
발급된 실제 ID를 사용하며, 심사 승인 전에는 일반 사용자가 설치할 수 없다.

## 개발용 연결

1. Chrome에서 `chrome://extensions`를 연다.
2. 개발자 모드를 켜고 **압축해제된 확장 프로그램 로드**에서 이 폴더를 선택한다.
3. 아이템 추가 → 구매내역에서 연결을 확인한다.

## 배포 패키지

저장소 루트에서 `python3 tools/package-order-extension.py /tmp`를 실행한다.
결과 ZIP에는 실행 코드·manifest·아이콘만 포함되며 테스트·문서·스토어 스크린샷은 제외한다.
등록 문구·권한 설명·심사 순서는 `STORE_LISTING.md`에 있다.
기존 `store-assets/screenshot-1280x800.png`는 이전 UI의 개발 화면이므로 업로드 전에
현재 화면으로 교체해야 한다.

개인정보 처리방침: https://realcloset.vercel.app/extension-privacy.html
