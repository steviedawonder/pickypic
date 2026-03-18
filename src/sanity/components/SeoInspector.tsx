// 블로그 글 작성 시 우측에 항상 표시되는 SEO + GEO 점수 패널
import { useState } from 'react';
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

/* ── GEO 유틸 함수 ── */
function countDefinitiveStatements(text: string): number {
  const patterns = [/입니다[.\s]/g, /합니다[.\s]/g, /됩니다[.\s]/g, /있습니다[.\s]/g, /입니다$/g, /합니다$/g];
  let count = 0;
  patterns.forEach(p => { count += (text.match(p) || []).length; });
  return count;
}
function hasLists(body: any): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((b) => b.listItem);
}
function hasQAPattern(body: any): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((b) =>
    (b.style === 'h2' || b.style === 'h3') &&
    b.children?.some((c: any) => (c.text || '').includes('?'))
  );
}
function hasSourcedStats(body: any): boolean {
  if (!Array.isArray(body)) return false;
  const text = getPlainText(body);
  const hasNumbers = /\d+[%건종개회억만천]/.test(text);
  return hasNumbers && hasLinks(body);
}
function countProperNouns(text: string): number {
  const patterns = [
    /[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g,
    /[가-힣]+(?:피키|부스|픽)/g,
  ];
  const matches = new Set<string>();
  patterns.forEach(p => {
    const found = text.match(p) || [];
    found.forEach(m => matches.add(m));
  });
  return matches.size;
}

/* ── 체크 항목 타입 ── */
interface Check {
  label: string;
  ok: boolean;
  msg: string;
  howToFix?: string;
}

/* ── SEO + GEO 패널 ── */
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
      howToFix: 'SEO 설정 탭에서 SEO 제목 필드에 포커스 키워드를 자연스럽게 포함시키세요. 예: "포토부스 렌탈 가이드: 행사별 추천"',
    },
    {
      label: '메타 설명에 포커스 키워드 포함',
      ok: !!focusKeyword && effectiveDesc.includes(focusKeyword),
      msg: focusKeyword ? (effectiveDesc.includes(focusKeyword) ? '포함되어 있습니다.' : '요약/설명에 키워드를 넣어주세요.') : '포커스 키워드를 입력하세요.',
      howToFix: '요약(미리보기) 또는 SEO 설명에 포커스 키워드를 1회 이상 자연스럽게 넣어주세요.',
    },
    {
      label: 'URL에 포커스 키워드 포함',
      ok: !!focusKeyword && slugVal.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s/g, '-')),
      msg: focusKeyword ? (slugVal.includes(focusKeyword.replace(/\s/g, '-')) ? '포함되어 있습니다.' : 'URL에 키워드가 포함되면 좋습니다.') : '포커스 키워드를 입력하세요.',
      howToFix: 'URL 슬러그를 키워드 기반으로 설정하세요. 예: "photobooth-rental-guide"',
    },
    {
      label: '본문 처음 10%에 포커스 키워드 포함',
      ok: !!focusKeyword && bodyText.slice(0, Math.max(bodyText.length * 0.1, 50)).includes(focusKeyword),
      msg: focusKeyword ? '글 시작 부분에 키워드를 자연스럽게 넣어주세요.' : '포커스 키워드를 입력하세요.',
      howToFix: '첫 번째 문단에서 포커스 키워드를 자연스럽게 언급하세요. 검색엔진은 글의 도입부를 중요하게 봅니다.',
    },
    {
      label: '본문에 포커스 키워드 포함',
      ok: !!focusKeyword && kwCount > 0,
      msg: focusKeyword ? (kwCount > 0 ? `${kwCount}회 사용됨.` : '본문에 키워드를 넣어주세요.') : '포커스 키워드를 입력하세요.',
      howToFix: '본문 전체에 걸쳐 키워드를 자연스럽게 3-5회 분산 배치하세요.',
    },
    {
      label: '본문 길이 충분',
      ok: bodyLen >= 600,
      msg: bodyLen > 0 ? `${bodyLen}자. ${bodyLen < 600 ? '600자 이상 권장.' : '충분합니다!'}` : '본문을 작성해주세요.',
      howToFix: '600자 이상의 본문을 작성하세요. 긴 글이 검색 상위에 노출될 확률이 높습니다.',
    },
    {
      label: '부제목(H2/H3)에 포커스 키워드 포함',
      ok: !!focusKeyword && Array.isArray(body) && body.some((b) => (b.style === 'h2' || b.style === 'h3') && b.children?.some((c: any) => (c.text || '').includes(focusKeyword))),
      msg: focusKeyword ? '소제목에 키워드를 넣으면 SEO에 유리합니다.' : '포커스 키워드를 입력하세요.',
      howToFix: 'H2 또는 H3 소제목 중 1개 이상에 포커스 키워드를 포함시키세요.',
    },
    {
      label: '이미지 alt에 포커스 키워드 포함',
      ok: !!focusKeyword && !!mainImage?.alt && mainImage.alt.includes(focusKeyword),
      msg: focusKeyword ? '대표 이미지 설명에 키워드를 넣어주세요.' : '포커스 키워드를 입력하세요.',
      howToFix: '대표 이미지 업로드 후 alt 텍스트에 포커스 키워드를 포함한 설명을 입력하세요.',
    },
    {
      label: '적절한 키워드 밀도',
      ok: !!focusKeyword && kwDensity >= 0.5 && kwDensity <= 3,
      msg: focusKeyword && bodyLen > 0 ? `밀도: ${kwDensity.toFixed(1)}%. ${kwDensity < 0.5 ? '0.5~3% 권장.' : kwDensity > 3 ? '과다 사용.' : '적절!'}` : '포커스 키워드를 입력하세요.',
      howToFix: '키워드 밀도 0.5~3%를 유지하세요. 너무 적으면 추가하고, 너무 많으면 일부를 유의어로 바꾸세요.',
    },
  ];

  /* ── 제목 가독성 ── */
  const titleChecks: Check[] = [
    {
      label: '제목 길이 적절',
      ok: title.length >= 10 && title.length <= 60,
      msg: title.length > 0 ? `${title.length}자. ${title.length < 10 ? '10자 이상.' : title.length > 60 ? '60자 이내.' : '적절!'}` : '제목을 입력하세요.',
      howToFix: '제목을 10~60자 범위로 작성하세요. 검색 결과에서 잘리지 않는 최적 길이입니다.',
    },
    {
      label: '제목에 숫자 포함',
      ok: /\d/.test(title),
      msg: '숫자가 있는 제목은 클릭률이 36% 높습니다.',
      howToFix: '제목에 숫자를 넣어보세요. 예: "5가지 포인트", "2024 트렌드", "3단계 가이드"',
    },
    {
      label: 'SEO 제목 설정',
      ok: seoTitle.length >= 20 && seoTitle.length <= 60,
      msg: seoTitle ? `${seoTitle.length}자.` : 'SEO 설정 탭에서 검색용 제목을 입력하세요.',
      howToFix: 'SEO 설정 탭으로 이동하여 20~60자의 검색 최적화 제목을 별도로 입력하세요.',
    },
  ];

  /* ── 콘텐츠 가독성 ── */
  const contentChecks: Check[] = [
    {
      label: '소제목(H2) 2개 이상 사용',
      ok: h2 >= 2,
      msg: `H2: ${h2}개, H3: ${h3}개. ${h2 < 2 ? '글을 단락별로 나눠주세요.' : '좋은 구조!'}`,
      howToFix: '본문을 2개 이상의 H2 소제목으로 나누세요. 각 섹션은 하나의 하위 주제를 다루도록 구성하세요.',
    },
    {
      label: '본문에 이미지 포함',
      ok: hasImages(body),
      msg: hasImages(body) ? '이미지가 포함되어 있습니다.' : '이미지를 넣으면 가독성이 좋아집니다.',
      howToFix: '본문에 관련 이미지를 1개 이상 삽입하세요. 500자마다 1개의 이미지가 이상적입니다.',
    },
    {
      label: '대표 이미지 설정',
      ok: !!mainImage?.asset,
      msg: mainImage?.asset ? '설정 완료!' : '대표 이미지가 있으면 클릭률이 2배 높아집니다.',
      howToFix: '상단의 대표 이미지 필드에 고품질 이미지를 업로드하세요.',
    },
    {
      label: '요약(미리보기) 작성',
      ok: excerpt.length >= 50 && excerpt.length <= 200,
      msg: excerpt ? `${excerpt.length}자.` : '요약을 작성하면 검색 결과에 표시됩니다.',
      howToFix: '50~200자의 요약문을 작성하세요. 글의 핵심 내용을 한두 문장으로 요약합니다.',
    },
  ];

  /* ── 링크 분석 ── */
  const linkChecks: Check[] = [
    {
      label: 'URL 슬러그 설정',
      ok: slugVal.length > 0 && slugVal.length <= 60,
      msg: slugVal ? `/${slugVal}` : 'Generate 버튼을 눌러주세요.',
      howToFix: '제목 옆의 Generate 버튼을 눌러 URL을 자동 생성하세요.',
    },
    {
      label: '본문에 링크 포함',
      ok: hasLinks(body),
      msg: hasLinks(body) ? '링크가 포함되어 있습니다.' : '관련 페이지 링크를 넣으면 좋습니다.',
      howToFix: '본문에 관련 페이지(제품소개, 렌탈문의 등) 또는 외부 참고 자료 링크를 1개 이상 넣으세요.',
    },
    {
      label: '태그 2개 이상',
      ok: !!tags && tags.length >= 2,
      msg: tags && tags.length > 0 ? `${tags.length}개 태그.` : '태그를 추가해주세요.',
      howToFix: '글의 주제와 관련된 태그를 2개 이상 추가하세요. 예: 포토부스, 렌탈, 브랜드팝업',
    },
    {
      label: '카테고리 설정',
      ok: !!category,
      msg: category ? '설정 완료!' : '카테고리를 선택해주세요.',
      howToFix: '글에 맞는 카테고리를 선택하세요 (트렌드, 가이드, 사례, 팁, 소식).',
    },
  ];

  /* ── GEO (AI 검색 최적화) 체크 ── */
  const definitiveCount = countDefinitiveStatements(bodyText);
  const properNounCount = countProperNouns(bodyText);

  const geoChecks: Check[] = [
    {
      label: '명확한 팩트 서술 (3문장+)',
      ok: definitiveCount >= 3,
      msg: `단정적 서술 ${definitiveCount}개 감지. ${definitiveCount >= 3 ? 'AI가 인용하기 좋은 구조!' : '더 필요합니다.'}`,
      howToFix: '"~입니다", "~합니다" 형식의 단정적 팩트 문장을 3개 이상 작성하세요. 예: "피키픽은 9종의 포토부스를 보유하고 있습니다."',
    },
    {
      label: '구조화된 목록 사용',
      ok: hasLists(body),
      msg: hasLists(body) ? '목록이 포함되어 있습니다.' : '목록 형식을 사용해보세요.',
      howToFix: '핵심 포인트를 글머리 기호(•) 또는 번호 목록으로 정리하세요. AI는 구조화된 데이터를 선호합니다.',
    },
    {
      label: 'Q&A 형식 포함',
      ok: hasQAPattern(body),
      msg: hasQAPattern(body) ? 'Q&A 패턴이 있습니다.' : '질문-답변 형식을 넣어보세요.',
      howToFix: 'H2/H3 소제목을 질문 형식으로 작성하세요. 예: "포토부스 렌탈 비용은 얼마인가요?" AI 검색에서 직접 답변으로 채택됩니다.',
    },
    {
      label: '출처 있는 통계/수치',
      ok: hasSourcedStats(body),
      msg: hasSourcedStats(body) ? '수치와 링크가 함께 있습니다.' : '통계에 출처 링크를 넣어보세요.',
      howToFix: '구체적 숫자(1,000건+, 9종 등)를 사용하고, 근거가 되는 페이지 링크를 함께 넣으세요.',
    },
    {
      label: '전문성 신호 (고유명사 5개+)',
      ok: properNounCount >= 5,
      msg: `고유명사/전문용어 ${properNounCount}개 감지. ${properNounCount >= 5 ? '전문성이 드러납니다!' : '더 필요합니다.'}`,
      howToFix: '브랜드명, 제품명, 기술 용어 등 고유명사를 5개 이상 사용하세요. 예: Modern Picky, Netflix, DSLR 등',
    },
    {
      label: '콘텐츠 완성도 (1,500자 & H2 3개+)',
      ok: bodyLen >= 1500 && h2 >= 3,
      msg: `${bodyLen}자, H2 ${h2}개. ${bodyLen >= 1500 && h2 >= 3 ? '종합적인 콘텐츠!' : '더 보강하세요.'}`,
      howToFix: '1,500자 이상의 본문을 3개 이상의 H2 섹션으로 나누어 주제를 깊이 있게 다루세요. AI는 포괄적인 콘텐츠를 선호합니다.',
    },
    {
      label: '요약문 충실도 (80자+)',
      ok: excerpt.length >= 80,
      msg: excerpt ? `${excerpt.length}자. ${excerpt.length >= 80 ? '충분!' : '더 상세하게.'}` : '요약문을 작성하세요.',
      howToFix: '80자 이상의 상세한 요약문을 작성하세요. AI 검색 결과에서 이 요약문이 직접 인용될 수 있습니다.',
    },
    {
      label: '권위적 어조 사용',
      ok: definitiveCount >= 5,
      msg: definitiveCount >= 5 ? '신뢰감 있는 어조!' : '더 확신 있는 어조로 작성하세요.',
      howToFix: '"~일 수 있습니다" 대신 "~입니다"처럼 확신 있는 어조를 사용하세요. AI는 명확한 답변을 제공하는 콘텐츠를 선호합니다.',
    },
  ];

  /* ── 점수 계산 ── */
  const seoAllChecks = [...basicSeo, ...titleChecks, ...contentChecks, ...linkChecks];
  const seoPassed = seoAllChecks.filter((c) => c.ok).length;
  const seoTotal = seoAllChecks.length;
  const seoScore = Math.round((seoPassed / seoTotal) * 100);

  const geoPassed = geoChecks.filter((c) => c.ok).length;
  const geoTotal = geoChecks.length;
  const geoScore = Math.round((geoPassed / geoTotal) * 100);

  const totalScore = Math.round(seoScore * 0.6 + geoScore * 0.4);

  const getColor = (score: number) => score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const getLabel = (score: number) => score >= 80 ? '좋아요!' : score >= 50 ? '개선 필요' : '개선 필요';

  const ScoreCircle = ({ score, label, size = 70 }: { score: number; label: string; size?: number }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', margin: '0 auto 4px',
        border: `4px solid ${getColor(score)}`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#fff',
      }}>
        <span style={{ fontSize: size * 0.34, fontWeight: '800', color: getColor(score) }}>{score}</span>
      </div>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#666', margin: 0 }}>{label}</p>
    </div>
  );

  const Section = ({ title, checks }: { title: string; checks: Check[] }) => {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const sectionPassed = checks.filter((c) => c.ok).length;
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#333' }}>{title}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>{sectionPassed}/{checks.length}</span>
        </div>
        <div style={{ marginTop: '6px' }}>
          {checks.map((c, i) => (
            <div
              key={i}
              style={{
                padding: '7px 0',
                borderBottom: i < checks.length - 1 ? '1px solid #f5f5f5' : 'none',
                cursor: !c.ok && c.howToFix ? 'pointer' : 'default',
              }}
              onClick={() => !c.ok && c.howToFix && setExpandedIdx(expandedIdx === i ? null : i)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>{c.ok ? '🟢' : '🔴'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: c.ok ? '#333' : '#555' }}>
                    {c.label}
                    {!c.ok && c.howToFix && <span style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }}>{expandedIdx === i ? '▲' : '▼'}</span>}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999', lineHeight: '1.4' }}>{c.msg}</p>
                </div>
              </div>
              {expandedIdx === i && c.howToFix && (
                <div style={{
                  marginTop: '6px', marginLeft: '22px', padding: '8px 10px',
                  background: '#fff8e1', borderRadius: '6px', border: '1px solid #ffe082',
                }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6d4c00', lineHeight: '1.5' }}>
                    💡 <strong>개선 방법:</strong> {c.howToFix}
                  </p>
                </div>
              )}
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
      {/* 종합 점수 */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#333' }}>종합 점수</p>
        <ScoreCircle score={totalScore} label={getLabel(totalScore)} size={80} />
      </div>

      {/* SEO + GEO 점수 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
        <ScoreCircle score={seoScore} label="SEO" size={56} />
        <ScoreCircle score={geoScore} label="GEO" size={56} />
      </div>

      <Section title="기본 SEO" checks={basicSeo} />
      <Section title="제목 가독성" checks={titleChecks} />
      <Section title="콘텐츠 가독성" checks={contentChecks} />
      <Section title="링크 분석" checks={linkChecks} />
      <Section title="GEO (AI 검색 최적화)" checks={geoChecks} />
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
      {/* 오른쪽: SEO+GEO 패널 (항상 표시) */}
      <div style={{
        width: '320px', flexShrink: 0,
        borderLeft: '1px solid #e5e5e5', background: '#fafafa',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        <SeoPanel />
      </div>
    </div>
  );
}
