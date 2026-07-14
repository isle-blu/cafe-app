# Cafe Isle

카페 주문 서비스를 구현한 풀스택 웹 애플리케이션입니다. 고객용 주문/장바구니/로열티 화면과 관리자용 메뉴·주문 관리 화면을 하나의 프로젝트로 제공합니다.

## 주요 기능

### 고객

- 메인 페이지: 히어로 배너, 추천 메뉴(인기·신규·시즌 통합), 진행 중 이벤트 안내
- 메뉴 조회: 카테고리별 탐색, 추천 메뉴 탭, 메뉴 상세, 카드에서 바로 옵션 선택 후 담기
- 장바구니: 수량 조절, 쿠폰 적용(등급 혜택 쿠폰/스탬프 쿠폰), 할인 계산 후 주문
- 주문 내역: 목록/상세 조회, 주문 상태 확인
- 마이페이지: 스탬프 적립 현황(시즌 메뉴는 2배 적립), 회원 등급, 보유 쿠폰함
- 다크 모드 지원

### 관리자

- 대시보드
- 메뉴 관리: 등록/수정, 그리드·리스트 보기 전환, 공개/비공개 전환(메뉴를 삭제하지 않고 노출 여부만 즉시 전환)
- 주문 관리: 목록/상세 조회, 주문 상태 변경

## 기술 스택

- **프론트엔드**: HTML / CSS / JavaScript (프레임워크 없이 구현), Font Awesome, Google Fonts
- **백엔드/데이터베이스**: [Supabase](https://supabase.com) (PostgreSQL, Row Level Security)
- **클라이언트 SDK**: `@supabase/supabase-js` v2
- **로컬 서버**: [`serve`](https://www.npmjs.com/package/serve)

## 폴더 구조

페이지 단위로 `.html` / `.css` / `.js`를 같은 위치에 두는 코로케이션 구조를 따릅니다.

```text
cafe-app/
├── index.html / .css / .js     # 메인 (고객)
├── menus/                      # 메뉴 조회 (고객)
├── basket/                     # 장바구니 (고객)
├── orders/                     # 주문 내역 (고객)
├── my/                         # 마이페이지 (고객)
├── login/                      # 로그인
├── admin/                      # 관리자 (대시보드, 메뉴/주문 관리)
├── css/variables.css           # 전역 CSS 변수
└── js/                         # 공통 데이터·유틸리티 (data.js, utils.js, supabase-client.js)
```

자세한 폴더/역할 구조는 [BLUEPRINT.md](./BLUEPRINT.md)를 참고하세요.

## 시작하기

### 요구 사항

- Node.js
- Supabase 프로젝트 (DB 연결은 `js/supabase-client.js`의 URL/anon key 설정을 사용)

### 설치 및 실행

```bash
npm install
npm start
```

`npm start`는 정적 서버(`serve`)를 3151 포트로 실행합니다. 브라우저에서 `http://localhost:3151` 접속.

### 테스트 계정

로그인 페이지(`login/index.html`)에서 아래 계정으로 로그인할 수 있습니다.

| 아이디    | 비밀번호  | 권한   |
| --------- | --------- | ------ |
| `admin` | `admin` | 관리자 |
| `test`  | `test`  | 일반 회원 |

## 데이터베이스

Supabase 상에 아래 테이블을 사용합니다.

| 테이블 | 설명 |
|---|---|
| `categories` | 메뉴 카테고리 |
| `menus` | 메뉴 정보 (가격, 옵션, 인기/신규/시즌 여부, 공개 여부 등) |
| `orders` / `order_items` | 주문 및 주문 항목 |
| `coupons` | 발급된 쿠폰 (스탬프 쿠폰, 등급별 월간 쿠폰 등) |
| `profiles` | 회원 프로필 및 스탬프/등급 정보 |
