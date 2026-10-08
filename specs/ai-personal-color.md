# AI 퍼스널컬러 포토부스 소개 페이지

> Status: 🔵 done (2026-10-08, PR 전) · Owner: pickypic · Created: 2026-10-08

## 1. Problem
피키픽은 촬영만으로 사계절 톤(봄웜·여름쿨·가을웜·겨울쿨)을 진단하는 AI 퍼스널컬러 포토부스를 판매·렌탈하지만, 사이트에는 이를 소개하는 페이지가 없다. 예전 `/ai-personal-color` 페이지(이미지 한 장짜리)는 2026-10-07에 내리고 `/rental`로 301 리다이렉트했다(커밋 45e26f2).
그 결과 이 상품을 찾는 행사·브랜드 담당자는 진단 흐름, 결과지, 커스터마이징, 사례를 확인할 곳이 없다. 이미 만들어 둔 완성 시안(AI 포토부스와 같은 디자인 체계)은 반영되지 못하고 있다. 해외 고객이 쓰는 영어·일본어 화면에서도 상품 설명이 비어 있다.

## 2. Scope
**In scope**
- `/ai-personal-color`에 시안(`index.html`)을 Astro 페이지로 옮긴다. 다음 섹션을 포함한다: 히어로, 이용 흐름 6단계(버튼으로 이미지 전환), 사계절 결과지, Urban/Modern 기종, 조명·판정 기준, 브랜드 커스터마이징, 운영 방식, FAQ, CTA.
- `vercel.json`의 `/ai-personal-color` 301 리다이렉트 3개를 지운다.
- 이미지 12장을 `public/images/ai-personal-color/`로 옮긴다. 시안의 24장 중 사례 사진 12장은 제외한다.
- 메뉴: 헤더·모바일 메뉴에서 "AI 포토부스" 바로 오른쪽, 푸터 서비스 링크에서 "AI 포토부스" 바로 아래에 "AI 퍼스널컬러"를 둔다.
- ko/en/ja: AI 포토부스(#2)와 같은 방식이다. 페이지 문구 전체에 `data-i18n` 키(`aipc.*`)를 달고 `translations.ts`에 ko/en/jp 문구를 추가한다. 번역은 Claude가 작성한다.
- SEO: title, description, og:image(`screen-main.jpg`), FAQPage 구조화 데이터, 빵부스러기(Breadcrumb), sitemap 우선순위 0.9 목록에 추가한다.
- 어드민 팝업 관리(PopupManager)의 노출 페이지 목록에 `/ai-personal-color`를 다시 추가한다.

**Out of scope**
- 사례 섹션("팝업부터 박람회까지"): 방문객 얼굴과 브랜드 사용 동의를 확인한 뒤 따로 추가한다.
- `/en/ai-personal-color` 같은 별도 영어 주소, hreflang. AI 포토부스와 마찬가지로 같은 주소에서 문구만 바뀐다.
- 이미지 고해상도 원본 교체: 원본을 받으면 같은 파일명으로 덮어쓴다.
- 컬러 옵션 13종 색상값 보정, 가격 표기: 시안 그대로 둔다.
- 렌탈문의 폼에 퍼스널컬러 전용 항목 추가(AI 포토부스의 `?ai=1` 같은 것).
- AI 포토부스와 스타일을 전역으로 합치는 것: 각 페이지 안에서만 적용한다.

## 3. User scenarios
- **국내 담당자:** 헤더에서 "AI 퍼스널컬러"를 누르면 `/ai-personal-color`가 열린다. "이용 흐름 보기"를 누르면 6단계 섹션으로 내려간다. 단계 버튼을 누르면 옆 화면 이미지가 바뀐다. FAQ를 펼쳐 보고 "도입 문의하기"를 누르면 `/rental`로 간다.
- **모바일 방문자:** 햄버거 메뉴에서 "AI 퍼스널컬러"로 들어온다. 화면 폭 375px에서 가로 스크롤 없이 모든 섹션을 읽는다. "카카오톡 상담"을 누르면 카카오 채널 채팅이 열린다.
- **일본어 방문자:** 언어 선택에서 JP를 누르면 메뉴와 페이지 본문이 일본어로 바뀐다. 한국어가 남은 문장이 없다. 영어(EN)도 AI 포토부스 페이지와 같은 방식으로 동작한다.
- **예전 주소로 오는 방문자:** 검색 결과나 북마크의 `/ai-personal-color`, `/ai-personal-color/`로 들어오면 렌탈문의가 아니라 새 페이지가 열린다. `/ai-personal-color/detail` 같은 하위 주소는 404가 된다.
- **어제 이 주소에 들어왔던 브라우저:** 301을 기억해서 한동안 `/rental`로 넘어갈 수 있다. 브라우저 캐시가 비워지면 해소되며, 받아들이는 위험으로 둔다.

## 4. Acceptance criteria
- [x] AC-1: 로컬 `/ai-personal-color`가 200으로 열리고, 시안의 섹션(사례 제외)이 같은 순서로 보인다.
- [x] AC-2: 이미지 12장이 모두 로드된다(이용 흐름 전환 이미지 포함, 깨진 이미지 0개). 사례 이미지 12장은 저장소에 들어가지 않는다.
- [x] AC-3: 이용 흐름 버튼 6개 각각을 누르면 해당 단계 이미지와 alt로 바뀐다.
- [x] AC-4: 페이지 CSS가 다른 페이지에 새지 않는다. 메인, `/ai-photobooth`, `/rental`의 모습이 작업 전과 같다(스크린샷 비교).
- [x] AC-5: 헤더(데스크톱), 모바일 메뉴, 푸터에 "AI 퍼스널컬러"가 "AI 포토부스" 바로 다음에 있고 `/ai-personal-color`로 연결된다.
- [x] AC-6: JP와 EN으로 바꿨을 때 페이지 본문, 메뉴, 푸터에 한국어 글자(한글)가 남지 않는다. 브랜드명과 이미지 속 글자는 예외로 한다.
- [x] AC-7: `vercel.json`에 `/ai-personal-color` 리다이렉트가 없다. `npm run build`가 성공하고, 빌드된 sitemap에 `/ai-personal-color/`가 있다.
- [x] AC-8: `<title>`, meta description, og:image, canonical(`https://picky-pic.com/ai-personal-color`)이 HANDOFF 값과 같다. FAQPage JSON-LD가 들어 있다.
- [x] AC-9: 폭 375px, 860px, 1440px에서 가로 스크롤이 생기지 않는다.
- [x] AC-10: "도입 문의하기"는 `/rental`, "카카오톡 상담"은 `http://pf.kakao.com/_qbEMb/chat`로 연결된다.
- [x] AC-11: 어드민 팝업 관리의 노출 페이지 목록에 "AI 퍼스널컬러"(`/ai-personal-color`)가 있다.

## 5. Non-functional requirements
- **Performance:** 첫 화면 밖 이미지는 `loading="lazy"`로 둔다. 외부 라이브러리를 추가하지 않는다(시안 스크립트는 바닐라 JS 한 개).
- **Security/Privacy:** 방문객 얼굴이 보이는 사례 사진은 제외한다. 새 환경변수나 API는 없다.
- **Accessibility/i18n:** 모든 이미지에 alt를 둔다. FAQ는 `<details>`를 유지한다. ko/en/jp 번역을 넣고, 일본어 줄바꿈과 글꼴은 AI 포토부스와 같은 방식으로 처리한다.
- **Compatibility:** 기존 페이지·메뉴 동작을 바꾸지 않는다. 반응형 기준은 860px와 480px로 시안과 같다.

## 6. Open questions
- [ ] 사례 섹션 공개 동의(방문객 얼굴, 4개 브랜드·행사명). 확인되면 후속 작업으로 추가한다.
- [ ] 이미지 고해상도 원본 제공 시점.
- [ ] 일본어·영어 번역 검수자(현지 표현 확인)가 필요한지.

## 7. Test plan
- AC-1, 2, 3, 10: 로컬 개발 서버에서 브라우저로 확인한다. 깨진 이미지는 `img.naturalWidth === 0` 개수로 검사하고, 버튼은 직접 클릭한다.
- AC-4: 작업 전후로 메인, `/ai-photobooth`, `/rental` 스크린샷을 찍어 비교한다.
- AC-5, 9: 데스크톱(1440)과 모바일(375) 화면에서 메뉴와 가로 스크롤 여부(`scrollWidth > clientWidth`)를 확인한다. 860px도 확인한다.
- AC-6: JP와 EN으로 바꾼 뒤 본문 텍스트에서 한글 정규식 `/[가-힣]/`로 남은 문장을 찾는다.
- AC-7, 8: `npm run build` 후 `dist`의 sitemap과 HTML head를 확인하고, `vercel.json`에서 해당 항목이 없는지 검사한다.
- AC-11: 코드에서 PopupManager 옵션을 확인한다.
- 회귀: `/ai-photobooth` 이용 흐름, 언어 전환, 렌탈문의 폼이 그대로 동작하는지 확인한다.

## 8. Implementation notes (filled during/after build)
- Key files touched: `src/pages/ai-personal-color.astro`(신규), `public/images/ai-personal-color/`(12장), `src/i18n/translations.ts`(`aipc.*`, `nav.ai_pc`, `footer.link.ai_personal_color`), `src/data/navigation.ts`, `src/components/common/Navbar.astro`, `src/components/common/Footer.astro`, `src/components/admin/pages/PopupManager.tsx`, `astro.config.mjs`, `vercel.json`
- 스펙 밖 변경: 메뉴가 7개가 되면서 1100~1279px에서 한국어 메뉴가 "회사소/개"처럼 글자 중간에서 끊겼다. 그래서 데스크톱 메뉴 간격을 `xl` 미만에서 32→20px로 줄이고, 한국어일 때만 줄바꿈을 막았다(`whitespace-nowrap`, `html[lang=ja]`에서는 해제). 일본어는 메뉴 글자가 길어 줄바꿈을 막으면 헤더 밖으로 넘치므로 기존처럼 줄바꿈된다. 1024~1139px에서는 로고가 두 줄이 된다(작업 전에는 1024~1099px).
- 검증 결과: 깨진 이미지 0개, 단계 버튼 6개 정상. 메인·`/ai-photobooth`·`/rental` 본문 스타일 지문이 작업 전과 동일. JP/EN 본문·메뉴에 한글 0줄(푸터의 회사명·주소·채널명은 사이트 공통 고유명사라 예외). `npm run build` 성공, sitemap에 priority 0.9로 포함.
- Migration / rollback plan: 이 PR을 되돌리면 된다. 리다이렉트를 다시 넣으려면 커밋 45e26f2의 `vercel.json` 항목을 복원한다.
- Follow-ups: 사례 섹션(동의 확인 후), 고해상도 이미지 교체. 예전 이미지 `personal-color.jpg`, `ai-personal-color-hero.jpg`, `detail/`이 `public/images/ai-personal-color/`에 남아 있다(이제 쓰지 않음, 이번에 지우지 않음).
