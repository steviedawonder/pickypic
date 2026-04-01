# PICKYPIC WEB - Claude Code 참고사항

## 프로젝트 개요
- Astro + TailwindCSS 기반 정적 사이트
- 배포: Vercel (GitHub 연동 자동 배포)
- CMS: Sanity
- i18n: ko (default), en, ja

---

## Domain Configuration

### Active Domains
- **picky-pic.com** - 메인 도메인 (Vercel에서 호스팅)

### Parked/Legacy Domains
- **pickyglobal.com** - 레거시 도메인 (카페24에서 관리, Vercel DNS)
  - Vercel 프로젝트(picky-pic)에 도메인으로 추가됨
  - vercel.json에서 picky-pic.com으로 301 리다이렉트 설정됨
  - **DNS**: 카페24에서 네임서버를 Vercel로 직접 설정 (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) — Cloudflare 미사용
- **www.pickyglobal.com** - 동일하게 Vercel에 추가, 리다이렉트 설정됨

### Domain 관련 주의사항
1. **pickyglobal.com은 절대 다운되면 안 됨** - 기존 고객/검색엔진이 접근할 수 있으므로 항상 picky-pic.com으로 리다이렉트되어야 함
2. pickyglobal.com의 DNS는 카페24에서 관리, 네임서버는 Vercel 직접 사용 (Cloudflare 미사용)
3. 네임서버: `ns1.vercel-dns.com`, `ns2.vercel-dns.com` — Vercel이 DNS + SSL + 리다이렉트 모두 처리
4. vercel.json의 redirects에 host 기반 301 리다이렉트가 설정되어 있음 - 수정/삭제하지 말 것
5. 새로운 도메인을 추가하거나 도메인 설정을 변경할 때는 레거시 도메인 리다이렉트가 정상 동작하는지 반드시 확인할 것

### 2026-04-01 Incident: pickyglobal.com SSL 525 에러
- **증상**: Cloudflare Error 525 (SSL handshake failed)
- **원인**: Cloudflare DNS가 origin 서버(Vercel)로 요청을 보내지만, Vercel에 pickyglobal.com 도메인이 등록되지 않아 SSL 인증서가 없음
- **해결**: Vercel에 pickyglobal.com 도메인 추가 + vercel.json에 리다이렉트 설정 + 카페24에서 네임서버를 Vercel로 변경 (Cloudflare 제거)

---

## 환경변수 & 배포 주의사항

### .env는 .gitignore에 포함되어 있어 Vercel에 전달되지 않는다

`.env` 파일은 git에 포함되지 않기 때문에 **Vercel 빌드 시 환경변수가 존재하지 않는다.**
Astro 프론트매터(SSR/SSG)에서 `import.meta.env.PUBLIC_*`를 읽어도 Vercel 빌드에서는 `undefined`가 된다.

**해결 방법 (둘 중 하나):**
1. Vercel 대시보드 → Project Settings → Environment Variables에 직접 등록
2. 공개 키(PUBLIC_ 접두사)는 하드코딩 폴백 사용 (현재 적용된 방식):
   ```astro
   const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID || 'service_lo0iveb';
   ```

### EmailJS 설정값 (PUBLIC - 브라우저 노출 무방)
| 변수 | 값 |
|---|---|
| PUBLIC_EMAILJS_SERVICE_ID | service_lo0iveb |
| PUBLIC_EMAILJS_TEMPLATE_ID | template_zyud66s (렌탈) |
| PUBLIC_EMAILJS_COLLAB_TEMPLATE_ID | template_1tlcr18 (협업) |
| PUBLIC_EMAILJS_PUBLIC_KEY | DiKfjM0kSilVVTle_ |

### EmailJS 연동 구조
- `rental.astro`, `collaboration.astro`의 프론트매터에서 EmailJS 설정값을 읽어 form `data-*` 속성에 주입
- 클라이언트 스크립트에서 `form.dataset.emailjsService` 등으로 읽어 사용
- `@emailjs/browser` 패키지 사용

---

## 어드민 패널 (/admin)

### 구조
- `src/pages/admin.astro` — React `client:only` 진입점
- `src/components/admin/AdminApp.tsx` — 53줄 라우터 (모든 페이지 import + renderPage switch)
- `src/components/admin/shared/` — 공통 모듈
  - `styles.ts` (colors, s, navItems), `AdminLayout.tsx`, `Toast.tsx`, `SeoComponents.tsx`, `seoScoring.ts`, `portableText.ts`
- `src/components/admin/pages/` — 각 관리 페이지 컴포넌트
  - Dashboard, BlogList, BlogEditor, PortfolioManager, FAQManager, CategoryManager
  - CollaborationManager, PopupManager, DownloadManager
  - **InquiryManager** (문의 관리), **BannerManager** (배너 관리), **EventManager** (이벤트 관리)
  - **FooterManager** (Footer 정보), **SettingsPage** (사이트 설정 6탭)
- `src/components/admin/PasswordGate.tsx` — HMAC 토큰 인증 (서버 검증)
- `src/components/admin/adminClient.ts` — 모든 Sanity API 호출 함수

### 인증 방식
- **PasswordGate → /api/auth (POST)** — 비밀번호 서버 검증 → HMAC-SHA256 토큰 발급 (24시간 유효)
- 토큰은 localStorage에 저장, 모든 API 요청에 `x-admin-auth` 헤더로 전송
- `/api/sanity.ts`에서 `validateToken` (auth.ts에서 import)으로 검증
- **비밀번호는 클라이언트에 절대 노출되지 않음** (PUBLIC_ 접두사 미사용)
- `ADMIN_PASSWORD` 환경변수 필수 (Vercel + .env 모두 설정 필요)

### Sanity 스키마
- 기존: blogPost, blogCategory, blogAuthor, portfolio, faqItem, popupBanner, collaborationRequest, downloadFile
- **추가됨**: `banner`, `inquiry`, `event`
- **siteSettings 확장**: SEO 기본값 + footer 12필드 + 코드삽입 5필드 + 외부서비스 11필드 + 이메일 5필드 + 보안 3필드 + 점검모드 3필드

### 사이트 설정 6탭 (SettingsPage.tsx)
1. **기본 설정** — SEO 제목/설명, 비밀번호 변경
2. **코드 삽입** — HEAD/BODY 스크립트, 메타태그, CSS (개발자 없이 삽입 가능)
3. **외부 서비스** — GTM, GA4, 네이버/카카오/Meta 픽셀, Search Console/네이버 인증, reCAPTCHA, 채팅 플러그인
4. **이메일 설정** — 관리자/렌탈/협업 알림 수신처, Slack 웹훅
5. **보안 설정** — IP 허용/차단, 로그인 실패 제한
6. **점검 모드** — 사이트 전체 점검 전환 + 예외 IP

### 프론트엔드 Sanity 연동
- `BaseLayout.astro` — siteSettings에서 GTM/GA4/픽셀/메타태그/스크립트를 동적 주입 (하드코딩 폴백 유지)
- `HeroSection.astro` — Sanity 배너 데이터 사용 (없으면 하드코딩 이미지 폴백)
- `Footer.astro` — Sanity siteSettings footer 데이터 사용 (없으면 company.ts 폴백)
- `rental.astro` — FAQ를 Sanity faqItem에서 동적 로드 (page: 'rental')
- **Footer 상호명** → `/admin` 히든 링크

### API 엔드포인트
- `/api/auth.ts` — login(비밀번호→토큰), verify(토큰 유효성), changePassword(Vercel 환경변수 안내)
- `/api/sanity.ts` — 범용 Sanity CRUD 프록시 + `submitInquiry` (인증 불필요, 필드 화이트리스트 적용)

### 환경변수 (Vercel 필수)
| 변수 | 설명 |
|---|---|
| `ADMIN_PASSWORD` | 어드민 로그인 비밀번호 (미설정 시 로그인 불가) |
| `SANITY_API_TOKEN` | Sanity 쓰기 토큰 (서버 전용) |

### Sanity에 마이그레이션된 하드코딩 값
- GTM ID: `GTM-KDRFNN4H`
- Google Search Console: `XALCn56VEHtBbtrm49DnZH2WdT3ccOizTGKTkTHsIns`
- 네이버 서치어드바이저: `062e44a0df871ea7efc1955b667ed80346b8d5ef`
- 회사 정보 (Footer): company.ts의 모든 값
- 렌탈 FAQ 6개 항목

### 주의사항
1. **AdminApp.tsx를 수정할 때**: 새 메뉴 추가 시 `shared/styles.ts`의 navItems + AdminApp.tsx의 switch case 모두 추가
2. **siteSettings 필드 추가 시**: 스키마 + adminClient.ts fetchSiteSettings 쿼리 + SettingsPage UI 모두 업데이트
3. **코드 삽입/배너/Footer 변경**: SSG이므로 Sanity 저장 후 재빌드 필요 (1-2분)
4. **submitInquiry**: 필드 화이트리스트가 적용됨, 새 필드 추가 시 sanity.ts의 allowed 배열 업데이트 필요

---

## 반복 작업 시 체크리스트

### 이메일 전송 관련 기능 수정 시
- [ ] EmailJS 설정값 폴백(`|| '...'`)이 있는지 확인
- [ ] `data-*` 속성에 값이 실제로 주입되는지 확인

### 배포 후 기능 확인 시
- [ ] picky-pic.com에서 직접 테스트 (로컬 .env와 Vercel 환경 차이 주의)
- [ ] 어드민에서 데이터 수정 후 1-2분 뒤 사이트에 반영되는지 확인 (SSG 재빌드)

### 새 Manager 컴포넌트 추가 시
- [ ] `shared/styles.ts`의 navItems에 새 메뉴 추가
- [ ] `AdminApp.tsx`의 switch case에 새 페이지 추가
- [ ] 프론트엔드에 표시되는 데이터라면 **반드시 triggerRebuild() 호출 추가**
- [ ] adminClient.ts에 CRUD 함수 추가
- [ ] Sanity 스키마 + schemas/index.ts 업데이트

### siteSettings 필드 추가 시
- [ ] `src/sanity/schemas/siteSettings.ts` 스키마에 필드 추가
- [ ] `adminClient.ts`의 fetchSiteSettings 쿼리에 필드 추가
- [ ] `SettingsPage.tsx` UI에 필드 추가
- [ ] 프론트엔드에서 사용하는 필드라면 `BaseLayout.astro` 쿼리에도 추가

---

## 실수 방지 — 반드시 지켜야 할 규칙

### 1. SSG 재빌드 필수 (가장 중요!)
Astro는 정적 사이트. Sanity 데이터 변경이 사이트에 반영되려면 **Vercel 재빌드**가 필요함.
- 모든 Manager 컴포넌트에서 create/update/delete 후 `triggerRebuild()` 호출 필수
- triggerRebuild()는 `/api/sanity`의 `triggerRebuild` 액션을 통해 서버에서 호출 (CORS 우회)
- Deploy Hook URL: `https://api.vercel.com/v1/integrations/deploy/prj_O7XjLkUJGOEvYnDMuYAjD8y5L96J/i7uhy3EGoA`

### 2. 로컬 테스트 ≠ 프로덕션 테스트
- 로컬 빌드 성공해도 Vercel 빌드가 실패할 수 있음 (환경변수 차이)
- **반드시 배포 후 picky-pic.com에서 직접 테스트**
- 브라우저 콘솔 에러, 네트워크 500 에러 확인 필수

### 3. Vercel 환경변수 주의
- `ADMIN_PASSWORD`: All Environments로 설정 필수 (미설정 시 로그인 불가)
- `SANITY_API_TOKEN`: Production에 설정. **값에 줄바꿈/공백 포함되지 않도록 주의** (과거 이 문제로 모든 API가 500 에러 발생)
- `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`: 코드에 하드코딩됨 (환경변수 불필요)

### 4. Vercel 프로젝트 중복 금지
- GitHub 레포 `steviedawonder/pickypic`은 **picky-pic** 프로젝트에만 연결
- 같은 레포로 두 번째 Vercel 프로젝트를 만들면 배포가 꼬임 (과거 `pickypic` 프로젝트 중복으로 배포 실패 경험)

### 5. QA는 코드 리뷰만으로 불충분
- 반드시 **배포된 사이트에서 브라우저로 실제 클릭/입력 테스트**
- 저장 후 사이트 반영까지 확인 (1-2분 대기)
- 네트워크 요청 상태코드 확인 (200 OK인지, 500 에러인지)

### 6. 하드코딩 값은 Sanity로 마이그레이션
- 새로운 하드코딩 값 발견 시 Sanity siteSettings로 이전
- company.ts는 폴백용으로만 유지, 실제 데이터는 Sanity에서 관리

### 7. pickyglobal.com 관련
- pickyglobal.com은 별도 그누보드 사이트 (origin IP 222.122.39.40)
- **절대 Vercel 연결/리다이렉트 금지** (MEMORY.md 참고)
- 쇼핑몰 관련 기능은 pickyglobal.com 어드민에서만 관리
