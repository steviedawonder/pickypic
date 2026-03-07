// 블로그 글 작성 시 우측에 항상 표시되는 SEO 점수 패널
import { useFormValue } from 'sanity';
import type { ObjectInputProps } from 'sanity';

/* ── 유틸 함수 ── */
function getPlainText(body: any): string {
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b._type === 'block')
    .map((b) => b.children?.map((c: any) => c.text || '').join('') || '')
    .join(' ');
}
function charLen(t: string) { return t.replace(/\s/g, '').length; }
function countH2(body: any): number {
  if (!Array.isArray(body)) return 0;
  return body.filter((b) => b.style === 'h2').length;
}
function countH3(body: any): number {
  if (!Array.isArray(body)) return 0;
  return body.filter((b) => b.style === 'h3').length;
}
function hasImages(body: any): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((b) => b._type === 'image');
}
function hasLinks(body: any): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((b) =>
    b.children?.some((c: any) => c.marks && c.marks.length > 0 && c.markDefs)
  );
}
function countKeyword(text: string, kw: string): number {
  if (!kw) return 0;
  const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

/* ── 체크 항목 타입 ── */
interface Check {
  label: string;
  ok: boolean;
  msg: string;
}

/* ── SEO 패널 ── */
function SeoPanel() {
  const title = (useFormValue(['title']) as string) || '';
  const excerpt = (useFormValue(['excerpt']) as string) || '';
  const body = useFormValue(['body']);
  const slug = useFormValue(['slug']) as any;
  const mainImage = useFormValue(['mainImage']) as any;
  const focusKeyword = (useFormValue(['focusKeyword']) as string) || '';
  const seoTitle = (useFormValue(['seoTitle']) as string) || '';
  const seoDesc = (useFormValue(['seoDescription']) as string) || '';
  const tags = useFormValue(['tags']) as string[] | undefined;
  const category = useFormValue(['category']);

  const bodyText = getPlainText(body);
  const bodyLen = charLen(bodyText);
  const h2 = countH2(body);
  const h3 = countH3(body);
  const slugVal = slug?.current || '';
  const effectiveTitle = seoTitle || title;
  const effectiveDesc = seoDesc || excerpt;
  const kwCount = countKeyword(bodyText, focusKeyword);
  const kwDensity = bodyLen > 0 && focusKeyword ? ((kwCount * charLen(focusKeyword)) / bodyLen * 100) : 0;

  /* ── 기본 SEO 체크 ── */
  const basicSeo: Check[] = [
    {
      label: 'SEO 제목에 포커스 키워드 포함',
      ok: !!focusKeyword && effectiveTitle.includes(focusKeyword),
      msg: focusKeyword ? (effectiveTitle.includes(focusKeyword) ? '포함되어 있습니다.' : '제목에 키워드를 넣어주세요.') : '포커스 키워드를 입력하세요.',
    },
    {
      label: '메타 설명에 포커스 키워드 포함',
      ok: !!focusKeyword && effectiveDesc.includes(focusKeyword),
      msg: focusKeyword ? (effectiveDesc.includes(focusKeyword) ? '포함되어 있습니다.' : '요약/설명에 키워드를 넣어주세요.') : '포커스 키워드를 입력하세요.',
    },
    {
      label: 'URL에 포커스 키워드 포함',
      ok: !!focusKeyword && slugVal.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s/g, '-')),
      msg: focusKeyword ? (slugVal.includes(focusKeyword.replace(/\s/g, '-')) ? '포함되어 있습니다.' : 'URL에 키워드가 포함되면 좋습니다.') : '포커스 키워드를 입력하세요.',
    },
    {
      label: '본문 처음 10%에 포커스 키워드 포함',
      ok: !!focusKeyword && bodyText.slice(0, Math.max(bodyText.length * 0.1, 50)).includes(focusKeyword),
      msg: focusKeyword ? '글 시작 부분에 키워드를 자연스럽게 넣어주세요.' : '포커스 키워드를 입력하세요.',
    },
    {
      label: '본문에 포커스 키워드 포함',
      ok: !!focusKeyword && kwCount > 0,
      msg: focusKeyword ? (kwCount > 0 ? `${kwCount}회 사용됨.` : '본문에 키워드를 넣어주세요.') : '포커스 키워드를 입력하세요.',
    },
    {
      label: '본문 길이 충분',
      ok: bodyLen >= 600,
      msg: bodyLen > 0 ? `본문 길이가 ${bodyLen}자입니다. ${bodyLen < 600 ? '600자 이상을 권장합니다.' : '충분합니다!'}` : '본문을 작성해주세요.',
    },
    {
      label: '부제목(H2/H3)에 포커스 키워드 포함',
      ok: !!focusKeyword && Array.isArray(body) && body.some((b) => (b.style === 'h2' || b.style === 'h3') && b.children?.some((c: any) => (c.text || '').includes(focusKeyword))),
      msg: focusKeyword ? '소제목에 키워드를 넣으면 SEO에 유리합니다.' : '포커스 키워드를 입력하세요.',
    },
    {
      label: '이미지 alt에 포커스 키워드 포함',
      ok: !!focusKeyword && !!mainImage?.alt && mainImage.alt.includes(focusKeyword),
      msg: focusKeyword ? '대표 이미지 설명에 키워드를 넣어주세요.' : '포커스 키워드를 입력하세요.',
    },
    {
      label: '적절한 키워드 밀도',
      ok: !!focusKeyword && kwDensity >= 0.5 && kwDensity <= 3,
      msg: focusKeyword && bodyLen > 0 ? `키워드 밀도: ${kwDensity.toFixed(1)}%. ${kwDensity < 0.5 ? '0.5~3%가 적당합니다.' : kwDensity > 3 ? '너무 많이 사용됐습니다.' : '적절합니다!'}` : '포커스 키워드를 입력하세요.',
    },
  ];

  /* ── 제목 가독성 ── */
  const titleChecks: Check[] = [
    {
      label: '제목 길이 적절',
      ok: title.length >= 10 && title.length <= 60,
      msg: title.length > 0 ? `${title.length}자. ${title.length < 10 ? '10자 이상이 좋습니다.' : title.length > 60 ? '60자 이내가 좋습니다.' : '적절합니다!'}` : '제목을 입력하세요.',
    },
    {
      label: '제목에 숫자 포함',
      ok: /\d/.test(title),
      msg: '숫자가 있는 제목은 클릭률이 36% 높습니다.',
    },
    {
      label: 'SEO 제목 설정',
      ok: seoTitle.length >= 20 && seoTitle.length <= 60,
      msg: seoTitle ? `${seoTitle.length}자. ${seoTitle.length < 20 ? '20자 이상이 좋습니다.' : seoTitle.length > 60 ? '60자 이내가 좋습니다.' : '적절합니다!'}` : 'SEO 설정 탭에서 검색용 제목을 입력하세요.',
    },
  ];

  /* ── 콘텐츠 가독성 ── */
  const contentChecks: Check[] = [
    {
      label: '소제목(H2) 2개 이상 사용',
      ok: h2 >= 2,
      msg: `H2: ${h2}개, H3: ${h3}개. ${h2 < 2 ? '글을 단락별로 나눠주세요.' : '좋은 구조입니다!'}`,
    },
    {
      label: '본문에 이미지 포함',
      ok: hasImages(body),
      msg: hasImages(body) ? '이미지가 포함되어 있습니다.' : '이미지를 넣으면 가독성이 좋아집니다.',
    },
    {
      label: '대표 이미지 설정',
      ok: !!mainImage?.asset,
      msg: mainImage?.asset ? '설정 완료!' : '대표 이미지가 있으면 클릭률이 2배 높아집니다.',
    },
    {
      label: '요약(미리보기) 작성',
      ok: excerpt.length >= 50 && excerpt.length <= 200,
      msg: excerpt ? `${excerpt.length}자. ${excerpt.length < 50 ? '50자 이상이 좋습니다.' : excerpt.length > 200 ? '200자 이내가 좋습니다.' : '적절합니다!'}` : '요약을 작성하면 검색 결과에 표시됩니다.',
    },
  ];

  /* ── 링크 분석 ── */
  const linkChecks: Check[] = [
    {
      label: 'URL 슬러그 설정',
      ok: slugVal.length > 0 && slugVal.length <= 60,
      msg: slugVal ? `/${slugVal}` : 'Generate 버튼을 눌러주세요.',
    },
    {
      label: '본문에 링크 포함',
      ok: hasLinks(body),
      msg: hasLinks(body) ? '링크가 포함되어 있습니다.' : '관련 페이지 링크를 넣으면 좋습니다.',
    },
    {
      label: '태그 2개 이상',
      ok: !!tags && tags.length >= 2,
      msg: tags && tags.length > 0 ? `${tags.length}개 태그.` : '태그를 추가해주세요.',
    },
    {
      label: '카테고리 설정',
      ok: !!category,
      msg: category ? '설정 완료!' : '카테고리를 선택해주세요.',
    },
  ];

  /* ── 점수 계산 ── */
  const allChecks = [...basicSeo, ...titleChecks, ...contentChecks, ...linkChecks];
  const passed = allChecks.filter((c) => c.ok).length;
  const total = allChecks.length;
  const score = Math.round((passed / total) * 100);

  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? '좋아요!' : score >= 40 ? '개선 필요' : '개선 필요';

  const Section = ({ title, checks }: { title: string; checks: Check[] }) => {
    const sectionPassed = checks.filter((c) => c.ok).length;
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#333' }}>{title}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>{sectionPassed}/{checks.length} 통과</span>
        </div>
        <div style={{ marginTop: '6px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 0', borderBottom: i < checks.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{c.ok ? '🟢' : '🔴'}</span>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: c.ok ? '#333' : '#555' }}>{c.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999', lineHeight: '1.4' }}>{c.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* 점수 */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: '#333' }}>SEO 점수</p>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 8px',
          border: `5px solid ${scoreColor}`, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#fff',
        }}>
          <span style={{ fontSize: '24px', fontWeight: '800', color: scoreColor }}>{score}</span>
        </div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: scoreColor, margin: 0 }}>{scoreLabel}</p>
      </div>

      <Section title="기본 SEO" checks={basicSeo} />
      <Section title="제목 가독성" checks={titleChecks} />
      <Section title="콘텐츠 가독성" checks={contentChecks} />
      <Section title="링크 분석" checks={linkChecks} />
    </div>
  );
}

/* ── 메인: 폼 + SEO 사이드바 ── */
export function BlogPostInput(props: ObjectInputProps) {
  return (
    <div style={{ display: 'flex', gap: '0', minHeight: '100vh' }}>
      {/* 왼쪽: 기본 폼 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {props.renderDefault(props)}
      </div>
      {/* 오른쪽: SEO 패널 (항상 표시) */}
      <div style={{
        width: '300px', flexShrink: 0,
        borderLeft: '1px solid #e5e5e5', background: '#fafafa',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        <SeoPanel />
      </div>
    </div>
  );
}
