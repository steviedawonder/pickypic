import { useMemo, useRef } from 'react';
import { colors, s } from '../shared/styles';
import { calculateScores } from '../shared/seoScoring';
import { ScoreCategoryPanel, ScoreCircle } from '../shared/SeoComponents';
import type { ScoreCheck } from '../shared/seoScoring';

interface NaverSeoSidebarProps {
  open: boolean;
  onToggle: () => void;
  form: {
    title: string;
    excerpt: string;
    body: string;
    focusKeyword: string;
    seoTitle: string;
    seoDescription: string;
    categoryId: string;
    tags: string[];
    publishedAt: string;
  };
  updateField: (field: string, value: any) => void;
  slug: string;
  onInsertH2?: () => void;
  onInsertImage?: () => void;
  onInsertLink?: () => void;
  onInsertList?: () => void;
}

// Priority order for failed checks
const PRIORITY_LABELS: string[] = [
  '게시물 콘텐츠에 포커스 키워드 포함',
  'SEO 제목에 포커스 키워드 사용',
  'SEO 메타 설명에 포커스 키워드 사용',
  'URL에 포커스 키워드 사용',
  '콘텐츠 시작 부분에 포커스 키워드 사용',
  '콘텐츠 길이 600자 이상',
  '소제목(H2/H3)으로 텍스트 분할',
  '소제목에 포커스 키워드 포함',
  '콘텐츠에 이미지 및/또는 비디오 포함',
  '메타 설명 길이 적정 (50~160자)',
  '외부 리소스에 링크',
  '웹사이트의 다른 리소스에 내부 링크',
  '리스트/목록 형식 포함',
  '태그 2개 이상 설정',
  '카테고리 설정',
];

function getPriorityIndex(label: string): number {
  const idx = PRIORITY_LABELS.indexOf(label);
  return idx === -1 ? 999 : idx;
}

interface FixAction {
  buttonLabel: string;
  action: () => void;
}

function getFixAction(
  check: ScoreCheck,
  keywordRef: React.RefObject<HTMLInputElement | null>,
  onInsertH2?: () => void,
  onInsertImage?: () => void,
  onInsertLink?: () => void,
  onInsertList?: () => void,
): FixAction | null {
  const l = check.label;
  if (
    l.includes('포커스 키워드') &&
    (l.includes('SEO 제목') || l.includes('메타 설명') || l.includes('URL') || l.includes('콘텐츠에 포커스') || l.includes('콘텐츠 시작') || l.includes('부제목에'))
  ) {
    return { buttonLabel: '키워드 설정', action: () => keywordRef.current?.focus() };
  }
  if (l.includes('게시물 콘텐츠에 포커스 키워드 포함')) {
    return { buttonLabel: '키워드 설정', action: () => keywordRef.current?.focus() };
  }
  if (l.includes('소제목') && onInsertH2) {
    return { buttonLabel: '소제목 추가', action: onInsertH2 };
  }
  if (l.includes('이미지') && onInsertImage) {
    return { buttonLabel: '이미지 추가', action: onInsertImage };
  }
  if ((l.includes('링크') || l.includes('출처')) && onInsertLink) {
    return { buttonLabel: '링크 추가', action: onInsertLink };
  }
  if (l.includes('리스트') || l.includes('목록')) {
    if (onInsertList) return { buttonLabel: '목록 추가', action: onInsertList };
  }
  return null;
}

export default function NaverSeoSidebar({
  open,
  onToggle,
  form,
  updateField,
  slug,
  onInsertH2,
  onInsertImage,
  onInsertLink,
  onInsertList,
}: NaverSeoSidebarProps) {
  const keywordRef = useRef<HTMLInputElement>(null);

  const scores = useMemo(
    () =>
      calculateScores({
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        focusKeyword: form.focusKeyword,
        seoTitle: form.seoTitle,
        seoDesc: form.seoDescription,
        tags: form.tags,
        category: form.categoryId,
        slug: slug,
      }),
    [form.title, form.excerpt, form.body, form.focusKeyword, form.seoTitle, form.seoDescription, form.tags, form.categoryId, slug],
  );

  const { seoCategories, geoCategories, seoScore, geoScore, totalScore, allSeoChecks, allGeoChecks } = scores;

  // Priority failed checks
  const priorityFixes = useMemo(() => {
    const allFailed = [...allSeoChecks, ...allGeoChecks].filter((c) => !c.ok);
    const sorted = allFailed.sort((a, b) => getPriorityIndex(a.label) - getPriorityIndex(b.label));
    return sorted.slice(0, 5);
  }, [allSeoChecks, allGeoChecks]);

  // Closed state: show vertical toggle tab
  if (!open) {
    return (
      <div style={{ position: 'relative', width: 0, flexShrink: 0 }}>
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            left: -32,
            top: 80,
            writingMode: 'vertical-rl',
            background: '#fff',
            border: `1px solid ${colors.border}`,
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            padding: '12px 6px',
            fontSize: 12,
            fontWeight: 700,
            color: colors.primary,
            cursor: 'pointer',
            letterSpacing: 2,
            zIndex: 5,
          }}
        >
          SEO
        </button>
      </div>
    );
  }

  const gradeColor = totalScore >= 80 ? colors.green : totalScore >= 50 ? colors.orange : colors.red;
  const gradeText = totalScore >= 80 ? '검색 노출 최적화 완료!' : totalScore >= 50 ? '개선이 필요합니다' : 'SEO 최적화가 부족합니다';

  const seoTitleLen = (form.seoTitle || '').length;
  const seoDescLen = (form.seoDescription || '').length;

  return (
    <div
      style={{
        width: 340,
        minWidth: 340,
        height: '100%',
        background: '#fafbfc',
        borderLeft: `1px solid #e5e8eb`,
        overflowY: 'auto',
        padding: '20px 16px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
        position: 'relative',
      }}
    >
      {/* Close toggle */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          color: colors.textLight,
          padding: 4,
        }}
        title="SEO 패널 닫기"
      >
        &times;
      </button>

      {/* ── Section 1: Score Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
        <ScoreCircle score={seoScore} label="SEO" size={48} />
        <ScoreCircle score={totalScore} label="종합" size={64} />
        <ScoreCircle score={geoScore} label="GEO" size={48} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: gradeColor, marginBottom: 12 }}>
        {gradeText}
      </div>

      <div style={{ borderBottom: '1px solid #e5e8eb', margin: '8px 0' }} />

      {/* ── Section 2: Priority Fixes ── */}
      {priorityFixes.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', padding: '12px 0' }}>
            지금 바로 개선하기
          </div>
          <div
            style={{
              background: '#fffbeb',
              borderLeft: '3px solid #f59e0b',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 12,
            }}
          >
            {priorityFixes.map((check, i) => {
              const fix = getFixAction(check, keywordRef, onInsertH2, onInsertImage, onInsertLink, onInsertList);
              return (
                <div key={i} style={{ marginBottom: i < priorityFixes.length - 1 ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: colors.red, fontSize: 13 }}>&#10060;</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{check.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, paddingLeft: 22 }}>
                    {check.detail}
                  </div>
                  {fix && (
                    <div style={{ paddingLeft: 22, marginTop: 4 }}>
                      <button
                        onClick={fix.action}
                        style={{
                          fontSize: 11,
                          background: '#f0f0f0',
                          borderRadius: 4,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          border: `1px solid ${colors.border}`,
                          fontWeight: 600,
                          color: '#333',
                        }}
                      >
                        {fix.buttonLabel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ borderBottom: '1px solid #e5e8eb', margin: '8px 0' }} />
        </>
      )}

      {/* ── Section 3: SEO Analysis ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', padding: '12px 0' }}>
        SEO 분석
      </div>
      {seoCategories.map((cat, i) => (
        <ScoreCategoryPanel key={i} category={cat} defaultOpen={cat.failCount > 0} />
      ))}

      <div style={{ borderBottom: '1px solid #e5e8eb', margin: '8px 0' }} />

      {/* ── Section 4: GEO Analysis ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', padding: '12px 0' }}>
        GEO 분석 (AI 검색 최적화)
      </div>
      {geoCategories.map((cat, i) => (
        <ScoreCategoryPanel key={i} category={cat} defaultOpen={cat.failCount > 0} />
      ))}

      <div style={{ borderBottom: '1px solid #e5e8eb', margin: '8px 0' }} />

      {/* ── Section 5: SEO Settings Inline Edit ── */}
      <details open>
        <summary style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', padding: '12px 0', cursor: 'pointer', listStyle: 'none' }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            SEO 설정
            <span style={{ fontSize: 14, color: colors.textLight }}>&#9662;</span>
          </span>
        </summary>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 12 }}>
          {/* Focus Keyword */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
              포커스 키워드
            </label>
            <input
              ref={keywordRef}
              type="text"
              value={form.focusKeyword}
              onChange={(e) => updateField('focusKeyword', e.target.value)}
              placeholder="예: 웨딩 포토부스"
              style={{ ...s.input, fontSize: 13 } as React.CSSProperties}
            />
          </div>

          {/* SEO Title */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
              SEO 제목
            </label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => updateField('seoTitle', e.target.value)}
              placeholder="검색 결과에 표시될 제목"
              style={{ ...s.input, fontSize: 13 } as React.CSSProperties}
            />
            <div style={{ fontSize: 11, textAlign: 'right', marginTop: 2, color: seoTitleLen > 60 ? colors.red : colors.textLight }}>
              {seoTitleLen}/60
            </div>
          </div>

          {/* SEO Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
              SEO 설명
            </label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => {
                updateField('seoDescription', e.target.value);
                updateField('excerpt', e.target.value);
              }}
              placeholder="검색 결과에 표시될 설명"
              rows={3}
              style={{ ...s.input, fontSize: 13, resize: 'vertical' as const, minHeight: 72 } as React.CSSProperties}
            />
            <div style={{ fontSize: 11, textAlign: 'right', marginTop: 2, color: seoDescLen > 160 ? colors.red : colors.textLight }}>
              {seoDescLen}/160
            </div>
          </div>
        </div>
      </details>

      <div style={{ borderBottom: '1px solid #e5e8eb', margin: '8px 0' }} />

      {/* ── Section 6: Search Preview ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', padding: '12px 0' }}>
        검색 결과 미리보기
      </div>
      <div
        style={{
          background: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 400,
            color: '#1a0dab',
            lineHeight: 1.3,
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {form.seoTitle || form.title || 'SEO 제목'}
        </div>
        <div style={{ fontSize: 12, color: '#006621', marginBottom: 4 }}>
          picky-pic.com/blog/{slug || 'url-slug'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#545454',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {form.seoDescription || '메타 설명이 여기에 표시됩니다.'}
        </div>
      </div>
    </div>
  );
}
