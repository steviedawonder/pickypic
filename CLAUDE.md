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

## 반복 작업 시 체크리스트

### 이메일 전송 관련 기능 수정 시
- [ ] EmailJS 설정값 폴백(`|| '...'`)이 있는지 확인
- [ ] `data-*` 속성에 값이 실제로 주입되는지 확인

### 배포 후 기능 확인 시
- [ ] picky-pic.com에서 직접 테스트 (로컬 .env와 Vercel 환경 차이 주의)
