# PICKYPIC WEB - Claude Code 참고사항

## 프로젝트 개요
- Astro + TailwindCSS 기반 정적 사이트
- 배포: Vercel (GitHub 연동 자동 배포)
- CMS: Sanity
- i18n: ko (default), en, ja
- 도메인: **picky-pic.com**

---

## 환경변수

### 절대 규칙: PUBLIC_ 환경변수 사용 금지
Vercel 빌드에서 플레이스홀더 주입 문제 발생. 공개 키는 **반드시 하드코딩**.

### 서버 전용 (Vercel + .env 설정 필수)
| 변수 | 용도 | 주의 |
|---|---|---|
| `ADMIN_PASSWORD` | 어드민 로그인 | All Environments 설정 필수 |
| `SANITY_API_TOKEN` | Sanity 쓰기 토큰 | 값에 줄바꿈/공백 주의 |
| `SANITY_READ_TOKEN` | Sanity 읽기 토큰 (Viewer) | 선택 — 없으면 `SANITY_API_TOKEN`으로 읽음. 데이터셋 비공개라 둘 다 없으면 사이트 데이터가 비어 보임 |
| `DEPLOY_HOOK_URL` | Vercel 배포 훅 (`triggerRebuild()` 재빌드) | Sensitive로 저장. 없으면 관리자 변경 사항이 사이트에 반영되지 않음. 넣거나 바꾼 뒤에는 재배포해야 적용 |
| `GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL` | Google Indexing API | 선택 — 미설정 시 발행 후 Google 색인 요청만 스킵 |
| `GOOGLE_INDEXING_PRIVATE_KEY` | Google Indexing API | 선택 — 줄바꿈은 `\n` 리터럴로 저장. Search Console에 서비스 계정을 OWNER로 추가 필수 |

### 하드코딩된 값
| 값 | 용도 |
|---|---|
| `service_lo0iveb` | EmailJS 서비스 ID |
| `template_zyud66s` / `template_1tlcr18` | EmailJS 렌탈/협업 템플릿 |
| `DiKfjM0kSilVVTle_` | EmailJS 공개 키 |
| `7b9lcco4` / `production` | Sanity 프로젝트 ID / 데이터셋 |
| `GTM-KDRFNN4H` | GTM 컨테이너 ID (폴백) |

---

## 어드민 패널 (/admin)

### 구조
- `admin.astro` → `AdminApp.tsx` (라우터) → 각 페이지 컴포넌트
- `shared/` — styles.ts, AdminLayout, Toast, SeoComponents 등
- `adminClient.ts` — 모든 Sanity API 호출
- `PasswordGate.tsx` — HMAC 토큰 인증 (서버 검증, 24시간 유효)

### 페이지 목록
Dashboard, BlogList, BlogEditor, PortfolioManager, FAQManager, CategoryManager, CollaborationManager, PopupManager, DownloadManager, InquiryManager, BannerManager, EventManager, FooterManager, SettingsPage(6탭)

### SettingsPage 6탭
1. 기본 설정 (SEO, 비밀번호)
2. 코드 삽입 (HEAD/BODY 스크립트, 메타태그, CSS)
3. 외부 서비스 (GTM, GA4, 픽셀, Search Console, reCAPTCHA, 채팅)
4. 이메일 설정 (알림 수신처, Slack 웹훅)
5. 보안 설정 (IP 허용/차단, 로그인 실패 제한)
6. 점검 모드 (사이트 점검 전환 + 예외 IP)

### API
- `/api/auth.ts` — login, verify. 비밀번호 변경은 Vercel `ADMIN_PASSWORD` 수정 후 재배포(토큰 HMAC 키라 기존 로그인 만료)
- `/api/sanity.ts` — Sanity CRUD 프록시 + submitInquiry (인증 불필요, 화이트리스트 적용)
- `/api/google-indexing.ts` — Google Indexing API (JWT, 서비스 계정 키 미설정 시 no-op). 관리자 인증 필요. Google 정책상 JobPosting/BroadcastEvent 전용이라 발행 흐름에서는 호출하지 않음
- `/api/indexnow.ts` — IndexNow (Bing/Naver/Yandex 등 공유). 관리자 인증 필요
- `/api/naver-indexing.ts` — Naver IndexNow 엔드포인트. 관리자 인증 필요
- 실제 쓰는 블로그 에디터는 `NaverBlogEditor` — 발행·발행글 저장 시, `PortfolioEditor` 저장 시 `requestSearchEngineIndexing(url)`이 IndexNow + Naver를 호출
- URL 규칙: canonical·사이트맵·내부 링크 모두 끝 슬래시 없음(루트 `/` 제외). 슬래시 붙은 주소는 vercel.json에서 301. canonical·JSON-LD URL은 `src/data/structuredData.ts`의 `pageUrl()`로 만든다

---

## 반복 작업 시 체크리스트

### 새 Manager 컴포넌트 추가 시
- `shared/styles.ts` navItems + `AdminApp.tsx` switch case 추가
- adminClient.ts CRUD 함수 + Sanity 스키마 추가
- 프론트엔드 데이터면 triggerRebuild() 호출 추가

### siteSettings 필드 추가 시
- 스키마 → adminClient.ts 쿼리 → SettingsPage UI → (프론트용이면) BaseLayout.astro 쿼리

---

## 실수 방지 규칙

1. **SSG 재빌드 필수** — Sanity 데이터 변경 → Vercel 재빌드 필요. Manager에서 CUD 후 `triggerRebuild()` 호출
2. **배포 후 실제 테스트** — 로컬 성공 ≠ 프로덕션 성공. picky-pic.com에서 직접 확인
3. **Vercel 프로젝트 중복 금지** — `steviedawonder/pickypic` 레포는 picky-pic 프로젝트에만 연결
4. **하드코딩 → Sanity 마이그레이션** — company.ts는 폴백용, 실제 데이터는 Sanity 관리
5. **pickyglobal.com은 별도 사이트** — 그누보드 쇼핑몰. 이 프로젝트와 절대 연결/리다이렉트 금지
6. **고객정보 문서는 `private.` ID 필수** — Sanity 데이터셋이 Public(Free 플랜은 Private 불가)이라 일반 ID 문서는 누구나 조회 가능. 문의·협업처럼 개인정보가 든 문서는 `_id: private.<uuid>`로 만들어야 토큰 없이는 안 보임
