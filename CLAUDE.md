# PICKYPIC WEB - Claude Code 참고사항

## 프로젝트 개요
- Astro + TailwindCSS 기반 정적 사이트
- 배포: Vercel (GitHub 연동 자동 배포)
- CMS: Sanity

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
