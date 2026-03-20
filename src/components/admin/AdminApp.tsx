import { useState, useEffect, useCallback, useRef } from 'react';
import PasswordGate from './PasswordGate';
import {
  fetchDashboardStats, fetchBlogPosts, fetchBlogPost, fetchCategories,
  createBlogPost, updateBlogPost, deleteBlogPost,
  fetchBlogTemplates, createBlogTemplate, deleteBlogTemplate,
  fetchPortfolioItems, createPortfolioItem, deletePortfolioItem, uploadImage,
  fetchFAQItems, createFAQItem, updateFAQItem, deleteFAQItem,
  fetchCollaborationRequests, updateCollaborationRequest, deleteCollaborationRequest,
  fetchPopupBanners, createPopupBanner, updatePopupBanner, deletePopupBanner, uploadImage as uploadImageAsset,
  fetchDownloadFiles, createDownloadFile, updateDownloadFile, deleteDownloadFile, uploadFile,
} from './adminClient';
import { portfolioItems as localPortfolioItems } from '../../data/portfolio';

// ── Styles ──
const colors = {
  bg: '#f8f9fa', sidebar: '#ffffff', sidebarActive: '#fef9e7',
  primary: '#d4a843', primaryDark: '#b8922e', text: '#1a1a1a',
  textLight: '#666', border: '#e8e8e8', card: '#ffffff',
  green: '#22c55e', orange: '#f59e0b', red: '#ef4444', blue: '#3b82f6',
};

const s = {
  sidebar: { width: 200, minWidth: 200, background: colors.sidebar, borderRight: `1px solid ${colors.border}`, height: '100vh', position: 'fixed' as const, left: 0, top: 0, display: 'flex', flexDirection: 'column' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif', zIndex: 10, overflowY: 'auto' as const },
  sidebarLogo: { padding: '20px 16px 16px', fontSize: 14, fontWeight: 800, color: colors.text, letterSpacing: '0.03em', borderBottom: `1px solid ${colors.border}` },
  navItem: { display: 'flex', alignItems: 'center' as const, gap: 8, padding: '11px 16px', fontSize: 13, fontWeight: 500, color: colors.textLight, cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left' as const, transition: 'all 0.15s', whiteSpace: 'nowrap' as const },
  navItemActive: { background: colors.sidebarActive, color: colors.text, fontWeight: 700 },
  main: { marginLeft: 200, padding: '24px 32px', background: colors.bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif', flex: 1, overflow: 'hidden' as const },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 800, color: colors.text },
  card: { background: colors.card, borderRadius: 12, padding: 24, border: `1px solid ${colors.border}`, marginBottom: 16 },
  statCard: { background: colors.card, borderRadius: 12, padding: '20px 24px', border: `1px solid ${colors.border}`, textAlign: 'center' as const },
  btn: { padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s' },
  btnPrimary: { background: colors.text, color: '#fff' },
  btnOutline: { background: '#fff', color: colors.text, border: `1px solid ${colors.border}` },
  btnDanger: { background: colors.red, color: '#fff' },
  input: { width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${colors.border}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '10px 14px', fontSize: 14, border: `1px solid ${colors.border}`, borderRadius: 8, outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit', minHeight: 120 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, color: colors.textLight, borderBottom: `2px solid ${colors.border}`, fontSize: 12 },
  td: { padding: '12px', borderBottom: `1px solid ${colors.border}`, color: colors.text },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 },
};

// ── Nav Items ──
const navItems = [
  { id: 'dashboard', icon: '📊', label: '대시보드' },
  { id: 'collaboration', icon: '🤝', label: '협업신청 관리' },
  { id: 'blogs', icon: '📝', label: '글 관리' },
  { id: 'categories', icon: '📁', label: '카테고리' },
  { id: 'portfolio', icon: '📸', label: '포트폴리오' },
  { id: 'faq', icon: '❓', label: 'FAQ 관리' },
  { id: 'popup', icon: '🖼️', label: '팝업 관리' },
  { id: 'downloads', icon: '📥', label: '다운로드 파일' },
  { id: 'settings', icon: '⚙️', label: '사이트 설정' },
];

// ── SEO/GEO Score Calculator (Rank Math style) ──
type ScoreCheck = { label: string; ok: boolean; detail: string };
type ScoreCategory = { name: string; checks: ScoreCheck[]; passCount: number; failCount: number };

function calculateScores(data: { title: string; excerpt: string; body: string; focusKeyword: string; seoTitle: string; seoDesc: string; tags: string[]; category: string; slug: string }) {
  const { title, excerpt, body, focusKeyword, seoTitle, seoDesc, tags, category, slug } = data;

  // Strip HTML tags for plain text analysis
  const plainBody = body.replace(/<[^>]*>/g, '');
  const bodyLen = plainBody.replace(/\s/g, '').length;
  const wordCount = plainBody.trim().split(/\s+/).filter(Boolean).length;
  const kwLower = focusKeyword?.toLowerCase() || '';
  const titleLower = title.toLowerCase();
  const excerptLower = excerpt.toLowerCase();
  const bodyLower = plainBody.toLowerCase();
  const seoTitleLower = (seoTitle || '').toLowerCase();
  const seoDescLower = (seoDesc || '').toLowerCase();
  const slugLower = (slug || '').toLowerCase();

  const kwCount = kwLower ? (bodyLower.split(kwLower).length - 1) : 0;
  const kwDensity = bodyLen > 0 && kwLower ? (kwCount * kwLower.length / bodyLen * 100) : 0;
  const h2Matches = body.match(/<h2[^>]*>/gi) || plainBody.match(/^## /gm) || [];
  const h2Count = h2Matches.length;
  const h3Matches = body.match(/<h3[^>]*>/gi) || plainBody.match(/^### /gm) || [];
  const h3Count = h3Matches.length;
  const linkCount = (body.match(/<a\s/gi) || []).length + (plainBody.match(/https?:\/\//g) || []).length;
  const hasLinks = linkCount > 0;
  const imgCount = (body.match(/<img\s/gi) || []).length;
  const definitiveCount = (plainBody.match(/입니다|합니다|됩니다|있습니다/g) || []).length;
  const questionCount = (plainBody.match(/\?/g) || []).length;
  const sentenceCount = (plainBody.match(/[.!?。]\s*/g) || []).length || 1;
  const avgSentenceLen = bodyLen / sentenceCount;
  const paragraphs = plainBody.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const shortParagraphs = paragraphs.filter(p => p.replace(/\s/g, '').length <= 300).length;
  const kwInFirst100 = kwLower ? bodyLower.slice(0, 150).includes(kwLower) : false;
  const titleHasNumber = /\d/.test(title);
  const titleHasPower = /비법|방법|가이드|꿀팁|노하우|비교|추천|완벽|필수|핵심|최고|TOP|best|tip/i.test(title);
  const usedKwBefore = false; // placeholder, can't check cross-post in frontend
  const hasDoFollowLinks = hasLinks; // treat all links as dofollow for simplicity

  // ─── SEO 기본 ───
  const seoBasic: ScoreCheck[] = [
    {
      label: 'SEO 제목에 포커스 키워드 사용',
      ok: !!kwLower && (seoTitleLower || titleLower).includes(kwLower),
      detail: kwLower
        ? (seoTitleLower || titleLower).includes(kwLower)
          ? `좋아요! SEO 제목에 포커스 키워드를 사용하고 있습니다.`
          : `SEO 제목에 "${focusKeyword}" 키워드를 포함시켜 주세요. 검색 결과에서 클릭률이 높아집니다.`
        : `포커스 키워드를 먼저 설정해 주세요.`
    },
    {
      label: 'SEO 메타 설명에 포커스 키워드 사용',
      ok: !!kwLower && (seoDescLower || excerptLower).includes(kwLower),
      detail: kwLower
        ? (seoDescLower || excerptLower).includes(kwLower)
          ? `좋아요! 메타 설명에서 사용되는 포커스 키워드가 포함되어 있습니다.`
          : `SEO 메타 설명(요약)에 "${focusKeyword}" 키워드를 넣어 주세요. 검색 결과 미리보기에 표시됩니다.`
        : `포커스 키워드를 먼저 설정해 주세요.`
    },
    {
      label: 'URL에 포커스 키워드 사용',
      ok: !!kwLower && slugLower.includes(kwLower.replace(/\s+/g, '-')),
      detail: kwLower
        ? slugLower.includes(kwLower.replace(/\s+/g, '-'))
          ? `좋아요! URL에 포커스 키워드가 포함되어 있습니다.`
          : `URL 슬러그에 "${focusKeyword}" 키워드를 포함시켜 주세요. URL은 50자 이내가 이상적입니다.`
        : `포커스 키워드를 먼저 설정해 주세요.`
    },
    {
      label: '콘텐츠 시작 부분에 포커스 키워드 사용',
      ok: kwInFirst100,
      detail: kwInFirst100
        ? `좋아요! 콘텐츠 시작 부분(처음 150자 이내)에 포커스 키워드가 있습니다.`
        : `게시물 콘텐츠의 첫 부분(150자 이내)에 "${focusKeyword || '키워드'}"를 넣어 주세요. 검색 엔진이 주제를 빠르게 파악합니다.`
    },
    {
      label: '게시물 콘텐츠에 포커스 키워드 포함',
      ok: kwCount > 0,
      detail: kwCount > 0
        ? `좋아요! 게시물 콘텐츠에 포커스 키워드가 있습니다.`
        : `본문에 "${focusKeyword || '키워드'}"를 자연스럽게 포함시켜 주세요.`
    },
    {
      label: '콘텐츠 길이 600자 이상',
      ok: bodyLen >= 600,
      detail: bodyLen >= 600
        ? `본문 길이가 ${bodyLen.toLocaleString()}자입니다. 잘했어요!`
        : `현재 ${bodyLen.toLocaleString()}자입니다. 최소 600자 이상 작성해 주세요. SEO에 유리한 콘텐츠 길이는 1,500자 이상입니다.`
    },
  ];

  // ─── SEO 추가 ───
  const seoExtra: ScoreCheck[] = [
    {
      label: '부제목에 포커스 키워드 포함',
      ok: !!kwLower && (body.match(/<h[2-4][^>]*>.*?<\/h[2-4]>/gi) || []).some(h => h.toLowerCase().includes(kwLower)),
      detail: (() => {
        const headings = (body.match(/<h[2-4][^>]*>.*?<\/h[2-4]>/gi) || []);
        const hasKwInHeading = headings.some(h => h.toLowerCase().includes(kwLower));
        return hasKwInHeading
          ? `좋아요! 부제목에 포커스 키워드가 있습니다.`
          : `H2, H3 등 부제목 중 하나에 "${focusKeyword || '키워드'}"를 포함시켜 주세요.`;
      })()
    },
    {
      label: '이미지 대체 속성에 포커스 키워드 사용',
      ok: !!kwLower && (body.match(/alt="[^"]*"/gi) || []).some(a => a.toLowerCase().includes(kwLower)),
      detail: (() => {
        const alts = body.match(/alt="[^"]*"/gi) || [];
        const hasKwInAlt = alts.some(a => a.toLowerCase().includes(kwLower));
        return hasKwInAlt
          ? `좋아요! 이미지 대체 속성에 포커스 키워드가 있습니다.`
          : `이미지의 alt 속성에 "${focusKeyword || '키워드'}"를 넣어 주세요. 이미지 검색 노출에 도움이 됩니다.`;
      })()
    },
    {
      label: `키워드 밀도 적정 범위 (0.5~3%)`,
      ok: kwDensity >= 0.5 && kwDensity <= 3,
      detail: kwLower
        ? kwDensity >= 0.5 && kwDensity <= 3
          ? `키워드 밀도가 ${kwDensity.toFixed(1)}%이고 포커스 키워드 조합이 ${kwCount}번 나타납니다.`
          : kwDensity < 0.5
            ? `키워드 밀도가 ${kwDensity.toFixed(1)}%로 낮습니다. 본문에 "${focusKeyword}"를 더 사용해 주세요. (권장: 0.5~3%)`
            : `키워드 밀도가 ${kwDensity.toFixed(1)}%로 높습니다. 키워드 과다 사용은 오히려 불이익이 될 수 있습니다. (권장: 0.5~3%)`
        : `포커스 키워드를 먼저 설정해 주세요.`
    },
    {
      label: 'URL 길이 적정 (50자 이내)',
      ok: (slug || title).length <= 50,
      detail: (slug || title).length <= 50
        ? `URL은 ${(slug || title).length}자 길이입니다. Kudos!`
        : `URL이 ${(slug || title).length}자입니다. 50자 이내로 줄여 주세요. 짧은 URL이 검색 결과에서 더 잘 보입니다.`
    },
    {
      label: '외부 리소스에 링크',
      ok: hasDoFollowLinks,
      detail: hasDoFollowLinks
        ? `좋아요! 외부 리소스에 링크하고 있습니다. 콘텐츠에 DoFollow가 포함된 외부 링크가 하나 이상 있습니다.`
        : `관련 외부 사이트(통계, 출처 등)에 링크를 넣어 주세요. 신뢰도가 높아집니다.`
    },
    {
      label: '웹사이트의 다른 리소스에 내부 링크',
      ok: linkCount >= 2,
      detail: linkCount >= 2
        ? `웹사이트의 다른 리소스에 연결하고 있습니다.`
        : `사이트 내 다른 글이나 페이지로 연결되는 내부 링크를 추가해 주세요. SEO에 매우 중요합니다.`
    },
    {
      label: '태그 2개 이상 설정',
      ok: tags.length >= 2,
      detail: tags.length >= 2
        ? `${tags.length}개의 태그가 설정되어 있습니다.`
        : `현재 ${tags.length}개 태그가 있습니다. 2개 이상의 관련 태그를 추가하면 분류와 검색에 도움이 됩니다.`
    },
    {
      label: '카테고리 설정',
      ok: !!category,
      detail: category
        ? `카테고리가 설정되어 있습니다.`
        : `카테고리를 선택해 주세요. 콘텐츠 분류가 명확해지면 사용자와 검색 엔진 모두에게 좋습니다.`
    },
  ];

  // ─── 제목 가독성 ───
  const titleReadability: ScoreCheck[] = [
    {
      label: 'SEO 제목 앞쪽에 포커스 키워드 배치',
      ok: !!kwLower && (seoTitleLower || titleLower).indexOf(kwLower) <= Math.floor((seoTitle || title).length * 0.4),
      detail: (() => {
        const t = seoTitleLower || titleLower;
        const idx = kwLower ? t.indexOf(kwLower) : -1;
        return idx >= 0 && idx <= Math.floor((seoTitle || title).length * 0.4)
          ? `좋아요! SEO 제목의 앞쪽에서 사용되는 포커스 키워드가 포함되어 있습니다.`
          : `SEO 제목의 앞부분(전체 길이의 40% 이내)에 포커스 키워드를 배치해 주세요. 검색 결과에서 눈에 더 잘 띕니다.`;
      })()
    },
    {
      label: 'SEO 제목에 숫자를 사용',
      ok: titleHasNumber,
      detail: titleHasNumber
        ? `SEO 제목에 숫자를 사용하고 있습니다. 클릭률이 높아집니다!`
        : `제목에 숫자를 포함하면 클릭률(CTR)이 36% 증가합니다. 예: "5가지 방법", "2025 가이드"`
    },
    {
      label: 'SEO 제목 길이 적정 (10~60자)',
      ok: title.length >= 10 && title.length <= 60,
      detail: title.length >= 10 && title.length <= 60
        ? `제목이 ${title.length}자입니다. 적절한 길이입니다!`
        : title.length < 10
          ? `현재 ${title.length}자입니다. 제목이 너무 짧습니다. 10자 이상으로 작성해 주세요.`
          : `현재 ${title.length}자입니다. 60자를 초과하면 검색 결과에서 잘릴 수 있습니다.`
    },
    {
      label: '파워 키워드 사용 (클릭 유도)',
      ok: titleHasPower,
      detail: titleHasPower
        ? `좋아요! 제목에 파워 키워드(가이드, 방법, 추천 등)가 포함되어 있습니다.`
        : `제목에 "가이드", "방법", "추천", "비교", "꿀팁" 등의 파워 키워드를 넣으면 클릭률이 높아집니다.`
    },
  ];

  // ─── 콘텐츠 가독성 ───
  const contentReadability: ScoreCheck[] = [
    {
      label: '소제목(H2/H3)으로 텍스트 분할',
      ok: h2Count + h3Count >= 2,
      detail: h2Count + h3Count >= 2
        ? `소제목을 사용하여 텍스트를 분해하는 것 같습니다. ${h2Count}개의 H2와 ${h3Count}개의 H3가 있습니다.`
        : `H2, H3 소제목으로 글을 나눠 주세요. 현재 소제목이 ${h2Count + h3Count}개입니다. 긴 글은 독자가 읽기 어렵습니다.`
    },
    {
      label: '짧은 문단 사용 (300자 이하)',
      ok: paragraphs.length === 0 || shortParagraphs >= paragraphs.length * 0.7,
      detail: paragraphs.length === 0
        ? `본문을 작성해 주세요.`
        : shortParagraphs >= paragraphs.length * 0.7
          ? `좋아요! 짧은 문단을 사용하고 있습니다. 전체 ${paragraphs.length}개 문단 중 ${shortParagraphs}개가 300자 이하입니다.`
          : `문단이 너무 깁니다. 전체 ${paragraphs.length}개 문단 중 ${paragraphs.length - shortParagraphs}개가 300자를 초과합니다. 짧은 문단이 읽기 쉽습니다.`
    },
    {
      label: '콘텐츠에 이미지 및/또는 비디오 포함',
      ok: imgCount >= 1,
      detail: imgCount >= 1
        ? `콘텐츠에 이미지가 ${imgCount}개 포함되어 있습니다. 시각적 콘텐츠는 독자 참여도를 높입니다.`
        : `이미지나 비디오를 추가해 주세요. 시각적 콘텐츠가 있는 글은 체류 시간이 2배 이상 늘어납니다.`
    },
    {
      label: '메타 설명 길이 적정 (50~160자)',
      ok: (seoDesc || excerpt).length >= 50 && (seoDesc || excerpt).length <= 160,
      detail: (() => {
        const len = (seoDesc || excerpt).length;
        return len >= 50 && len <= 160
          ? `메타 설명이 ${len}자입니다. 적절합니다!`
          : len < 50
            ? `현재 ${len}자입니다. 50자 이상 작성해야 검색 결과에서 충분한 정보를 제공합니다.`
            : `현재 ${len}자입니다. 160자를 넘으면 검색 결과에서 잘립니다. 핵심만 간결하게 작성해 주세요.`;
      })()
    },
  ];

  // ─── GEO (AI 검색 최적화) 기본 ───
  const geoBasic: ScoreCheck[] = [
    {
      label: '명확한 팩트 서술 (3문장 이상)',
      ok: definitiveCount >= 3,
      detail: definitiveCount >= 3
        ? `단정적 서술("~입니다", "~합니다")이 ${definitiveCount}개 있습니다. AI가 인용하기 좋은 형식입니다.`
        : `현재 단정적 서술이 ${definitiveCount}개입니다. "~입니다" 형식의 명확한 문장을 3개 이상 사용하면 AI 검색에서 인용될 확률이 높아집니다.`
    },
    {
      label: '질문-답변(Q&A) 형식 포함',
      ok: questionCount >= 1 && h2Count >= 1,
      detail: questionCount >= 1 && h2Count >= 1
        ? `질문 형식이 ${questionCount}개 포함되어 있고 소제목도 있습니다. AI 검색이 Q&A 형식을 선호합니다.`
        : `소제목을 질문 형식("웨딩 포토부스란?", "비용은 얼마인가요?")으로 작성하면 AI 검색 결과에 직접 인용됩니다.`
    },
    {
      label: '전문 용어/브랜드명 사용 (5개 이상)',
      ok: (plainBody.match(/[A-Z][a-zA-Z]{2,}/g) || []).length >= 5,
      detail: (() => {
        const terms = (plainBody.match(/[A-Z][a-zA-Z]{2,}/g) || []);
        return terms.length >= 5
          ? `전문 용어/브랜드명이 ${terms.length}개 감지되었습니다. AI가 전문성을 인식합니다.`
          : `현재 ${terms.length}개입니다. 브랜드명, 제품명, 전문 용어를 5개 이상 사용하면 AI가 콘텐츠의 전문성을 더 높이 평가합니다.`;
      })()
    },
    {
      label: '콘텐츠 1,500자 이상 (AI 검색 유리)',
      ok: bodyLen >= 1500,
      detail: bodyLen >= 1500
        ? `본문이 ${bodyLen.toLocaleString()}자입니다. AI 검색에 충분한 길이입니다.`
        : `현재 ${bodyLen.toLocaleString()}자입니다. 1,500자 이상의 콘텐츠가 AI 검색(Perplexity, SGE 등)에서 인용될 가능성이 3배 높습니다.`
    },
  ];

  // ─── GEO 추가 ───
  const geoExtra: ScoreCheck[] = [
    {
      label: '소제목 3개 이상 (깊이 있는 콘텐츠)',
      ok: h2Count >= 3,
      detail: h2Count >= 3
        ? `H2 소제목이 ${h2Count}개 있습니다. 주제를 깊이 있게 다루고 있어 AI가 구조화된 정보로 인식합니다.`
        : `현재 H2 소제목이 ${h2Count}개입니다. 3개 이상의 소제목으로 주제를 세분화하면 AI가 각 섹션을 독립적으로 인용할 수 있습니다.`
    },
    {
      label: '요약문 80자 이상 (AI 스니펫용)',
      ok: (seoDesc || excerpt).length >= 80,
      detail: (() => {
        const len = (seoDesc || excerpt).length;
        return len >= 80
          ? `요약문이 ${len}자입니다. AI가 스니펫으로 활용하기 좋은 길이입니다.`
          : `현재 ${len}자입니다. 80자 이상의 상세한 요약을 작성하면 AI 검색 결과의 스니펫으로 직접 사용됩니다.`;
      })()
    },
    {
      label: '출처/참고 링크 포함',
      ok: hasLinks,
      detail: hasLinks
        ? `외부 링크가 포함되어 있습니다. 통계나 수치의 출처가 있으면 AI가 콘텐츠 신뢰도를 높게 평가합니다.`
        : `통계, 수치, 주장의 출처 링크를 넣어 주세요. AI는 출처가 있는 콘텐츠를 더 자주 인용합니다.`
    },
    {
      label: '권위적 어조 (확신 있는 서술)',
      ok: definitiveCount >= 5,
      detail: definitiveCount >= 5
        ? `확신 있는 서술이 ${definitiveCount}개 있습니다. 권위 있는 어조가 AI 인용에 유리합니다.`
        : `현재 ${definitiveCount}개입니다. "~일 수 있습니다" 대신 "~입니다"로 확신 있게 작성하세요. AI는 단정적 표현을 더 자주 인용합니다.`
    },
    {
      label: '리스트/목록 형식 포함',
      ok: /<[ou]l>/i.test(body) || /^[-*]\s/m.test(plainBody),
      detail: /<[ou]l>/i.test(body) || /^[-*]\s/m.test(plainBody)
        ? `목록 형식이 포함되어 있습니다. AI가 구조화된 목록을 직접 인용하기 좋습니다.`
        : `글머리 기호(UL) 또는 번호 목록(OL)을 사용해 주세요. AI 검색이 목록 형식의 답변을 선호합니다.`
    },
    {
      label: '숫자/통계 데이터 포함',
      ok: (plainBody.match(/\d+[%만원억천개건명]/g) || []).length >= 2,
      detail: (() => {
        const stats = (plainBody.match(/\d+[%만원억천개건명]/g) || []);
        return stats.length >= 2
          ? `수치/통계 데이터가 ${stats.length}개 포함되어 있습니다. 구체적 수치는 AI 인용 확률을 크게 높입니다.`
          : `구체적인 숫자와 통계("30% 절감", "50만원부터" 등)를 2개 이상 포함해 주세요. AI는 수치가 포함된 문장을 우선 인용합니다.`;
      })()
    },
  ];

  const allSeoChecks = [...seoBasic, ...seoExtra, ...titleReadability, ...contentReadability];
  const allGeoChecks = [...geoBasic, ...geoExtra];

  const seoScore = Math.round(allSeoChecks.filter(c => c.ok).length / allSeoChecks.length * 100);
  const geoScore = Math.round(allGeoChecks.filter(c => c.ok).length / allGeoChecks.length * 100);
  const totalScore = Math.round(seoScore * 0.6 + geoScore * 0.4);

  const seoCategories: ScoreCategory[] = [
    { name: '기본 SEO', checks: seoBasic, passCount: seoBasic.filter(c => c.ok).length, failCount: seoBasic.filter(c => !c.ok).length },
    { name: '추가', checks: seoExtra, passCount: seoExtra.filter(c => c.ok).length, failCount: seoExtra.filter(c => !c.ok).length },
    { name: '제목 가독성', checks: titleReadability, passCount: titleReadability.filter(c => c.ok).length, failCount: titleReadability.filter(c => !c.ok).length },
    { name: '콘텐츠 가독성', checks: contentReadability, passCount: contentReadability.filter(c => c.ok).length, failCount: contentReadability.filter(c => !c.ok).length },
  ];

  const geoCategories: ScoreCategory[] = [
    { name: 'AI 검색 기본', checks: geoBasic, passCount: geoBasic.filter(c => c.ok).length, failCount: geoBasic.filter(c => !c.ok).length },
    { name: 'AI 검색 심화', checks: geoExtra, passCount: geoExtra.filter(c => c.ok).length, failCount: geoExtra.filter(c => !c.ok).length },
  ];

  return { seoCategories, geoCategories, seoScore, geoScore, totalScore, allSeoChecks, allGeoChecks };
}

// ── Collapsible Score Category Component ──
function ScoreCategoryPanel({ category, defaultOpen = false }: { category: ScoreCategory; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const allPass = category.failCount === 0;
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          color: colors.text, textAlign: 'left',
        }}
      >
        <span>{category.name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {category.failCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: colors.red, borderRadius: 10, padding: '1px 8px' }}>
              ✕ {category.failCount} 오류
            </span>
          )}
          {allPass && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: colors.green, borderRadius: 10, padding: '1px 8px' }}>
              ✓ 모두 정상
            </span>
          )}
          <span style={{ fontSize: 16, color: colors.textLight, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 10 }}>
          {category.checks.map((check, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 12, lineHeight: 1.6, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, marginTop: 2 }}>
                {check.ok
                  ? <span style={{ color: colors.green, fontSize: 14 }}>✓</span>
                  : <span style={{ color: colors.red, fontSize: 14 }}>✕</span>
                }
              </span>
              <span style={{ color: check.ok ? '#444' : '#333' }}>{check.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score Circle ──
function ScoreCircle({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const color = score >= 80 ? colors.green : score >= 50 ? colors.orange : colors.red;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', border: `4px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', background: '#fff' }}>
        <span style={{ fontSize: size * 0.35, fontWeight: 800, color }}>{score}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: colors.textLight }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════
// ── Dashboard Page ──
// ══════════════════════════════════════
function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {});
    fetchBlogPosts().then(setPosts).catch(() => {});
  }, []);

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>대시보드</h1>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📄', label: '전체 글', value: stats?.totalPosts ?? '-', color: colors.text },
          { icon: '✅', label: '발행됨', value: stats?.published ?? '-', color: colors.green },
          { icon: '📝', label: '임시저장', value: stats?.drafts ?? '-', color: colors.orange },
          { icon: '📸', label: '포트폴리오', value: stats?.portfolioCount ?? '-', color: colors.blue },
        ].map((item, i) => (
          <div key={i} style={s.statCard}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 2, whiteSpace: 'nowrap' }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)', gap: 12 }}>
        {/* Recent Posts */}
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>최근 수정된 글</h2>
            <button onClick={() => onNavigate('blogs')} style={{ ...s.btn, ...s.btnOutline, padding: '6px 14px', fontSize: 12 }}>전체 보기 →</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>제목</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>상태</th>
                <th style={s.th}>수정일</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 5).map((post: any) => (
                <tr key={post._id}>
                  <td style={{ ...s.td, fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#f0f0f0', color: colors.textLight }}>{post.category?.title || '-'}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: post.publishedAt ? '#dcfce7' : '#fef9c3', color: post.publishedAt ? colors.green : colors.orange }}>
                      {post.publishedAt ? '발행됨' : '임시저장'}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: colors.textLight, fontSize: 12 }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko') : '-'}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>글이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Quick Actions + Categories */}
        <div>
          <div style={s.card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>바로가기</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '+ 새 글 작성', page: 'blog-new' },
                { label: '📁 카테고리', page: 'categories' },
                { label: '📸 포트폴리오', page: 'portfolio' },
                { label: '❓ FAQ 관리', page: 'faq' },
              ].map((item, i) => (
                <button key={i} onClick={() => onNavigate(item.page)} style={{ ...s.btn, ...s.btnOutline, fontSize: 12, padding: '12px 8px', whiteSpace: 'nowrap' }}>{item.label}</button>
              ))}
            </div>
          </div>
          <div style={s.card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>카테고리별 글 수</h2>
            {stats?.categories?.map((cat: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < stats.categories.length - 1 ? `1px solid ${colors.border}` : 'none', fontSize: 13 }}>
                <span>{cat.title}</span>
                <span style={{ fontWeight: 700 }}>{cat.count}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Blog List Page ──
// ══════════════════════════════════════
function BlogList({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchBlogPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 글을 삭제하시겠습니까?`)) {
      await deleteBlogPost(id);
      load();
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>글 관리</h1>
        <button onClick={() => onNavigate('blog-new')} style={{ ...s.btn, ...s.btnPrimary }}>+ 새 글 작성</button>
      </div>
      <div style={s.card}>
        {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>제목</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>상태</th>
                <th style={s.th}>작성일</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post: any) => (
                <tr key={post._id} style={{ cursor: 'pointer' }} onClick={() => onNavigate('blog-edit', post._id)}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{post.title}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#f0f0f0' }}>{post.category?.title || '-'}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: post.publishedAt ? '#dcfce7' : '#fef9c3', color: post.publishedAt ? colors.green : colors.orange }}>
                      {post.publishedAt ? '발행됨' : '임시저장'}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12, color: colors.textLight }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko') : '-'}</td>
                  <td style={s.td}>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(post._id, post.title); }} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>글이 없습니다. 새 글을 작성해보세요!</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Rich Text Editor Component ──
// ══════════════════════════════════════
const toolbarBtnStyle: React.CSSProperties = {
  padding: '6px 10px', fontSize: 13, fontWeight: 600, border: 'none',
  background: 'none', cursor: 'pointer', color: colors.text, borderRadius: 4,
  minWidth: 32, textAlign: 'center', transition: 'background 0.15s',
};

function RichTextEditor({ value, onChange, onImageSelect }: { value: string; onChange: (html: string) => void; onImageSelect?: (img: HTMLImageElement | null) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);
  const resizeState = useRef<{ img: HTMLImageElement; startX: number; startY: number; startW: number; startH: number; handle: string } | null>(null);

  // Image resize overlay state
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgRect, setImgRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Notify parent when image selection changes
  useEffect(() => {
    onImageSelect?.(selectedImg);
  }, [selectedImg]);

  // Click outside to deselect image
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedImg && !(e.target as HTMLElement)?.closest?.('.img-resize-overlay') && !(e.target as HTMLElement)?.closest?.('.image-settings-panel') && !(e.target as HTMLElement)?.closest?.('.img-overlay-wrapper') && !(e.target as HTMLElement)?.closest?.('.img-overlay-minibar') && e.target !== selectedImg) {
        setSelectedImg(null);
        setImgRect(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedImg]);

  // Select media on click and add click overlays to iframes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selectMedia = (media: HTMLElement) => {
      const tag = media.tagName.toLowerCase();
      setSelectedImg(media as any);
      const editorRect = editor.getBoundingClientRect();
      let target: HTMLElement;
      if (tag === 'iframe' || tag === 'video') {
        target = media.parentElement!;
      } else if (media.parentElement?.classList?.contains('img-overlay-wrapper')) {
        target = media.parentElement!;
      } else {
        target = media;
      }
      const r = target.getBoundingClientRect();
      setImgRect({ top: r.top - editorRect.top, left: r.left - editorRect.left, width: r.width, height: r.height });
    };

    // Add transparent click overlays to all iframes/videos in editor
    const addOverlays = () => {
      editor.querySelectorAll('div[contenteditable="false"]').forEach(wrapper => {
        if (wrapper.querySelector('.media-click-overlay')) return;
        const media = wrapper.querySelector('iframe') || wrapper.querySelector('video');
        if (!media) return;
        const overlay = document.createElement('div');
        overlay.className = 'media-click-overlay';
        overlay.style.cssText = 'position:absolute;inset:0;cursor:pointer;z-index:1;';
        (wrapper as HTMLElement).style.position = 'relative';
        overlay.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); selectMedia(media as HTMLElement); });
        wrapper.appendChild(overlay);
      });
    };

    const handleImgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        selectMedia(target);
      }
    };

    addOverlays();
    editor.addEventListener('click', handleImgClick);
    // Re-add overlays when content changes
    const observer = new MutationObserver(addOverlays);
    observer.observe(editor, { childList: true, subtree: true });

    return () => {
      editor.removeEventListener('click', handleImgClick);
      observer.disconnect();
    };
  }, []);

  // Get the resizable target element (for iframes/videos or overlay wrappers, resize the parent wrapper)
  const getResizeTarget = (): HTMLElement | null => {
    if (!selectedImg) return null;
    const tag = selectedImg.tagName.toLowerCase();
    if (tag === 'iframe' || tag === 'video') {
      return selectedImg.parentElement as HTMLElement;
    }
    const parent = selectedImg.parentElement;
    if (parent?.classList?.contains('img-overlay-wrapper')) {
      return parent as HTMLElement;
    }
    return selectedImg;
  };

  // Handle resize drag
  const startResize = (handle: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = getResizeTarget();
    if (!target) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = target.offsetWidth;
    const startH = target.offsetHeight;
    const aspectRatio = startW / startH;
    const isMedia = selectedImg!.tagName.toLowerCase() === 'iframe' || selectedImg!.tagName.toLowerCase() === 'video';

    const onMouseMove = (ev: MouseEvent) => {
      let newW = startW;
      let newH = startH;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (handle.includes('right')) newW = Math.max(100, startW + dx);
      if (handle.includes('left')) newW = Math.max(100, startW - dx);
      if (handle.includes('bottom')) newH = Math.max(60, startH + dy);
      if (handle.includes('top')) newH = Math.max(60, startH - dy);

      // Corner handles maintain aspect ratio
      if (handle.length > 6) {
        newH = newW / aspectRatio;
      }

      target.style.width = `${newW}px`;
      target.style.maxWidth = '100%';
      if (isMedia) {
        // Also resize the inner iframe/video
        selectedImg!.style.width = '100%';
        selectedImg!.style.height = `${newH}px`;
        target.style.height = 'auto';
      } else {
        target.style.height = `${newH}px`;
      }

      const editor = editorRef.current;
      if (editor) {
        const editorRect = editor.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        setImgRect({ top: r.top - editorRect.top, left: r.left - editorRect.left, width: r.width, height: r.height });
      }
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      syncContent();
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Image alignment - apply to wrapper if image has text overlay wrapper
  const alignImage = (align: 'left' | 'center' | 'right') => {
    if (!selectedImg) return;
    const parent = selectedImg.parentElement;
    const hasWrapper = parent?.style?.position === 'relative' && parent?.classList?.contains('img-overlay-wrapper');
    const target = hasWrapper ? parent! : selectedImg;
    target.style.display = align === 'center' ? 'block' : 'inline-block';
    target.style.margin = align === 'center' ? '8px auto' : '8px 0';
    target.style.float = align === 'center' ? 'none' : align;
    syncContent();
    // Update rect
    const editor = editorRef.current;
    if (editor) {
      setTimeout(() => {
        const editorRect = editor.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        setImgRect({ top: r.top - editorRect.top, left: r.left - editorRect.left, width: r.width, height: r.height });
      }, 50);
    }
  };

  // Delete selected media (image/video/iframe) - also removes wrapper if present
  const deleteSelectedMedia = () => {
    if (!selectedImg) return;
    const tag = selectedImg.tagName.toLowerCase();
    const parent = selectedImg.parentElement;
    const hasOverlayWrapper = parent?.classList?.contains('img-overlay-wrapper');
    let target: HTMLElement | null;
    if (tag === 'iframe' || tag === 'video') {
      target = parent;
    } else if (hasOverlayWrapper) {
      target = parent;
    } else {
      target = selectedImg;
    }
    if (target) {
      target.remove();
      setSelectedImg(null);
      setImgRect(null);
      syncContent();
    }
  };

  // Keyboard handler - only Escape to deselect (delete only via toolbar button)
  useEffect(() => {
    if (!selectedImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImg(null);
        setImgRect(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg]);

  // Sync external value into editor only when it changes externally
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    syncContent();
  };

  const syncContent = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleHeading = (tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    syncContent();
  };

  const handleLink = () => {
    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url) exec('createLink', url);
  };

  // Heading dropdown state
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [currentHeading, setCurrentHeading] = useState('본문');
  const headingDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(e.target as Node)) setShowHeadingDropdown(false);
    };
    if (showHeadingDropdown) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showHeadingDropdown]);

  // Detect current heading at cursor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const detectHeading = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node || !editor.contains(node)) return;
      let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
      while (el && el !== editor) {
        const tag = el.tagName?.toLowerCase();
        if (tag === 'h1') { setCurrentHeading('제목 1'); return; }
        if (tag === 'h2') { setCurrentHeading('제목 2'); return; }
        if (tag === 'h3') { setCurrentHeading('제목 3'); return; }
        if (tag === 'h4') { setCurrentHeading('제목 4'); return; }
        el = el.parentElement;
      }
      setCurrentHeading('본문');
    };
    document.addEventListener('selectionchange', detectHeading);
    return () => document.removeEventListener('selectionchange', detectHeading);
  }, []);

  const applyHeading = (tag: string, label: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    setCurrentHeading(label);
    setShowHeadingDropdown(false);
    syncContent();
  };

  // Insert menu state
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Close insert menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
        setShowInsertMenu(false);
      }
    };
    if (showInsertMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showInsertMenu]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await uploadImage(file);
      const imgUrl = asset.url;
      const altText = file.name.replace(/\.[^/.]+$/, '');
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${imgUrl}" alt="${altText}" style="max-width:100%;height:auto;margin:8px 0;" />`);
      syncContent();
    } catch (err: any) {
      alert('이미지 업로드 실패: ' + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Rotate selected image
  const rotateImage = (degrees: number) => {
    if (!selectedImg || selectedImg.tagName.toLowerCase() !== 'img') return;
    const current = selectedImg.style.transform || '';
    const match = current.match(/rotate\((\d+)deg\)/);
    const currentDeg = match ? parseInt(match[1]) : 0;
    const newDeg = (currentDeg + degrees) % 360;
    selectedImg.style.transform = newDeg === 0 ? '' : `rotate(${newDeg}deg)`;
    syncContent();
  };

  // Add text overlay to selected image - inline editable, draggable within image bounds
  const addTextOverlay = () => {
    if (!selectedImg || selectedImg.tagName.toLowerCase() !== 'img') return;
    const parent = selectedImg.parentElement;

    // If overlay already exists, focus it for editing
    if (parent?.classList?.contains('img-overlay-wrapper') && parent?.querySelector?.('.img-text-overlay')) {
      const overlay = parent.querySelector('.img-text-overlay') as HTMLElement;
      overlay.focus();
      return;
    }

    // Wrap image in relative container
    const wrapper = document.createElement('div');
    wrapper.className = 'img-overlay-wrapper';
    wrapper.style.cssText = 'position:relative;display:inline-block;max-width:100%;overflow:hidden;';
    selectedImg.parentElement?.insertBefore(wrapper, selectedImg);
    wrapper.appendChild(selectedImg);

    // Create editable overlay
    const overlay = document.createElement('div');
    overlay.className = 'img-text-overlay';
    overlay.contentEditable = 'true';
    overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#ffffff;font-size:24px;font-weight:700;text-shadow:0 2px 6px rgba(0,0,0,0.6);padding:8px 16px;cursor:text;min-width:40px;min-height:1em;outline:none;white-space:nowrap;user-select:text;z-index:5;';
    overlay.textContent = '텍스트 입력';
    wrapper.appendChild(overlay);

    // Create mini toolbar (hidden by default)
    const miniBar = document.createElement('div');
    miniBar.className = 'img-overlay-minibar';
    miniBar.style.cssText = 'position:absolute;top:-32px;left:50%;transform:translateX(-50%);display:none;gap:4px;background:#1a1a1a;border-radius:6px;padding:3px 6px;z-index:20;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;';
    miniBar.innerHTML = `
      <button class="overlay-btn" data-action="size-down" title="글씨 축소" style="width:24px;height:22px;border:none;background:none;cursor:pointer;border-radius:3px;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">A-</button>
      <button class="overlay-btn" data-action="size-up" title="글씨 확대" style="width:24px;height:22px;border:none;background:none;cursor:pointer;border-radius:3px;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;">A+</button>
      <input type="color" data-action="color" value="#ffffff" title="글씨 색상" style="width:22px;height:22px;border:1px solid #555;border-radius:3px;cursor:pointer;padding:0;background:none;" />
      <button class="overlay-btn" data-action="remove-text" title="텍스트 삭제" style="width:24px;height:22px;border:none;background:none;cursor:pointer;border-radius:3px;color:#ff6666;font-size:12px;display:flex;align-items:center;justify-content:center;">✕</button>
    `;
    wrapper.appendChild(miniBar);

    // Mini toolbar button handlers
    miniBar.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'size-up') {
        const cur = parseInt(overlay.style.fontSize) || 24;
        overlay.style.fontSize = Math.min(cur + 4, 80) + 'px';
        syncContent();
      } else if (action === 'size-down') {
        const cur = parseInt(overlay.style.fontSize) || 24;
        overlay.style.fontSize = Math.max(cur - 4, 10) + 'px';
        syncContent();
      } else if (action === 'remove-text') {
        overlay.remove();
        miniBar.remove();
        // Unwrap: move image out of wrapper
        const img = wrapper.querySelector('img');
        if (img) {
          wrapper.parentElement?.insertBefore(img, wrapper);
          wrapper.remove();
        }
        syncContent();
      }
    });

    // Color input change
    const colorInput = miniBar.querySelector('input[data-action="color"]') as HTMLInputElement;
    colorInput?.addEventListener('input', (e) => {
      overlay.style.color = (e.target as HTMLInputElement).value;
      syncContent();
    });

    // Show minibar when overlay is focused/clicked
    overlay.addEventListener('focus', () => {
      miniBar.style.display = 'flex';
    });

    overlay.addEventListener('blur', () => {
      setTimeout(() => {
        // Don't hide if focus went to minibar
        if (!miniBar.contains(document.activeElement)) {
          miniBar.style.display = 'none';
          syncContent();
        }
      }, 200);
    });

    // Dragging logic
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let overlayStartLeft = 0, overlayStartTop = 0;

    overlay.addEventListener('mousedown', (e: MouseEvent) => {
      // If clicking to edit text, don't drag
      if (overlay === document.activeElement || (e.target as HTMLElement).isContentEditable) {
        // Already editing, let text selection work
        if (overlay.textContent !== '텍스트 입력') return;
      }
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const wrapperRect = wrapper.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      overlayStartLeft = overlayRect.left - wrapperRect.left + overlayRect.width / 2;
      overlayStartTop = overlayRect.top - wrapperRect.top + overlayRect.height / 2;
      overlay.style.cursor = 'grabbing';

      const onMove = (ev: MouseEvent) => {
        if (!isDragging) return;
        const dx = ev.clientX - dragStartX;
        const dy = ev.clientY - dragStartY;
        const wRect = wrapper.getBoundingClientRect();
        const oRect = overlay.getBoundingClientRect();
        // Calculate new center position as percentage
        let newLeft = overlayStartLeft + dx;
        let newTop = overlayStartTop + dy;
        // Clamp within wrapper bounds
        const halfW = oRect.width / 2;
        const halfH = oRect.height / 2;
        newLeft = Math.max(halfW, Math.min(wRect.width - halfW, newLeft));
        newTop = Math.max(halfH, Math.min(wRect.height - halfH, newTop));
        // Convert to percentage for responsive
        const leftPct = (newLeft / wRect.width) * 100;
        const topPct = (newTop / wRect.height) * 100;
        overlay.style.left = leftPct + '%';
        overlay.style.top = topPct + '%';
      };

      const onUp = () => {
        isDragging = false;
        overlay.style.cursor = 'text';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        syncContent();
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Double-click to edit text
    overlay.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      overlay.focus();
      miniBar.style.display = 'flex';
      // Select all text on double click for easy replacement
      const range = document.createRange();
      range.selectNodeContents(overlay);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    // Prevent editor from deselecting image when clicking overlay
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Focus the overlay for immediate editing
    setTimeout(() => {
      overlay.focus();
      const range = document.createRange();
      range.selectNodeContents(overlay);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, 50);

    syncContent();
    // Update rect after DOM change
    const editor = editorRef.current;
    if (editor) {
      setTimeout(() => {
        const editorRect = editor.getBoundingClientRect();
        const r = wrapper.getBoundingClientRect();
        setImgRect({ top: r.top - editorRect.top, left: r.left - editorRect.left, width: r.width, height: r.height });
      }, 100);
    }
  };

  // YouTube modal state
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubePreviewId, setYoutubePreviewId] = useState('');

  const handleVideoInsert = () => {
    setYoutubeUrl('');
    setYoutubeError('');
    setYoutubePreviewId('');
    setShowYoutubeModal(true);
    setShowInsertMenu(false);
  };

  const extractYoutubeId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return '';
  };

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    setYoutubeError('');
    const id = extractYoutubeId(url);
    setYoutubePreviewId(id);
  };

  const confirmYoutubeInsert = () => {
    if (!youtubePreviewId) {
      setYoutubeError('유효한 유튜브 링크를 입력해 주세요.');
      return;
    }
    editorRef.current?.focus();
    const embedHtml = `<div style="position:relative;max-width:560px;margin:12px 0;" contenteditable="false"><iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubePreviewId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:315px;border-radius:8px;"></iframe></div>`;
    document.execCommand('insertHTML', false, embedHtml);
    syncContent();
    setShowYoutubeModal(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await uploadImage(file);
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<div style="max-width:560px;margin:12px 0;" contenteditable="false"><video controls style="width:100%;border-radius:8px;" src="${asset.url}"></video></div>`);
      syncContent();
    } catch (err: any) {
      alert('동영상 업로드 실패: ' + err.message);
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await uploadFile(file);
      editorRef.current?.focus();
      const sizeStr = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)}KB` : `${(file.size / 1024 / 1024).toFixed(1)}MB`;
      document.execCommand('insertHTML', false, `<div contenteditable="false" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;margin:8px 0;font-size:13px;"><span style="font-size:18px;">📎</span><a href="${asset.url}" target="_blank" rel="noopener" style="color:#3b82f6;text-decoration:none;font-weight:600;">${file.name}</a><span style="color:#999;font-size:11px;">(${sizeStr})</span></div>`);
      syncContent();
    } catch (err: any) {
      alert('파일 업로드 실패: ' + err.message);
    }
    if (fileUploadRef.current) fileUploadRef.current.value = '';
  };

  // (iframe/video click handling is now in the combined selectMedia handler above)

  // Font size dropdown
  const fontSizes = [11, 13, 15, 16, 19, 24, 28, 30, 34, 38];
  const [showFontSize, setShowFontSize] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState(15);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) setShowFontSize(false);
    };
    if (showFontSize) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontSize]);

  // Detect current font size at cursor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const detectSize = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node || !editor.contains(node)) return;
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
      if (el) {
        const computed = window.getComputedStyle(el).fontSize;
        const px = parseInt(computed);
        if (px && px !== currentFontSize) setCurrentFontSize(px);
      }
    };
    document.addEventListener('selectionchange', detectSize);
    return () => document.removeEventListener('selectionchange', detectSize);
  }, [currentFontSize]);

  // Helper: insert a styled span and place cursor inside it
  const insertStyledSpan = (styles: Partial<CSSStyleDeclaration>) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
      const span = document.createElement('span');
      Object.assign(span.style, styles);
      span.textContent = '\u200B';
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      // Place cursor inside the span, after the zero-width space
      const newRange = document.createRange();
      newRange.setStart(span.firstChild!, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      const range = sel.getRangeAt(0);
      const contents = range.extractContents();
      const span = document.createElement('span');
      Object.assign(span.style, styles);
      span.appendChild(contents);
      range.insertNode(span);
      sel.collapseToEnd();
    }
    syncContent();
  };

  const applyFontSize = (size: number) => {
    // Preserve current font family when changing size
    const currentFont = fontFamilies.find(f => f.label === currentFontFamily);
    const styles: Partial<CSSStyleDeclaration> = { fontSize: `${size}px` };
    if (currentFont) styles.fontFamily = currentFont.value;
    insertStyledSpan(styles);
    setCurrentFontSize(size);
    setShowFontSize(false);
  };

  // Font family dropdown (웹폰트 기반 - 모든 OS에서 동작)
  const fontFamilies = [
    { label: '프리텐다드', value: 'Pretendard, sans-serif' },
    { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
    { label: '나눔명조', value: '"Nanum Myeongjo", serif' },
    { label: '나눔스퀘어', value: '"NanumSquare", sans-serif' },
    { label: '고딕 A1', value: '"Gothic A1", sans-serif' },
    { label: '노토 산스', value: '"Noto Sans KR", sans-serif' },
    { label: '노토 세리프', value: '"Noto Serif KR", serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier', value: '"Courier New", monospace' },
  ];
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [currentFontFamily, setCurrentFontFamily] = useState('프리텐다드');
  const fontFamilyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontFamilyRef.current && !fontFamilyRef.current.contains(e.target as Node)) setShowFontFamily(false);
    };
    if (showFontFamily) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFontFamily]);

  const applyFontFamily = (font: { label: string; value: string }) => {
    // Preserve current font size when changing font family
    insertStyledSpan({ fontFamily: font.value, fontSize: `${currentFontSize}px` });
    setCurrentFontFamily(font.label);
    setShowFontFamily(false);
  };

  // Text color picker - 7 columns (gray, red, orange, yellow, green, blue, purple) x 7 rows (light→dark)
  const textColors = [
    // Col:  Gray      Red       Orange    Yellow    Green     Blue      Purple
    /*1*/  '#ffffff', '#ffcccc', '#ffe0cc', '#ffffcc', '#ccffcc', '#cce0ff', '#e0ccff',
    /*2*/  '#dddddd', '#ff9999', '#ffbb77', '#ffff99', '#99ff99', '#99ccff', '#cc99ff',
    /*3*/  '#bbbbbb', '#ff6666', '#ff9933', '#ffff66', '#66cc66', '#6699ff', '#9966ff',
    /*4*/  '#888888', '#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0066ff', '#6633cc',
    /*5*/  '#555555', '#cc0000', '#cc5500', '#cc9900', '#009900', '#0044cc', '#4400aa',
    /*6*/  '#333333', '#880000', '#883300', '#886600', '#006600', '#003388', '#330077',
    /*7*/  '#000000', '#440000', '#441a00', '#443300', '#003300', '#001a44', '#1a0033',
  ];
  const [showTextColor, setShowTextColor] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#1a1a1a');
  const textColorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) setShowTextColor(false);
    };
    if (showTextColor) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTextColor]);

  const applyTextColor = (color: string) => {
    editorRef.current?.focus();
    document.execCommand('foreColor', false, color);
    setCurrentTextColor(color);
    setShowTextColor(false);
    syncContent();
  };

  const toolbarGroups: { label: string; action: () => void; title: string }[][] = [
    [
      { label: '\u2022 UL', action: () => exec('insertUnorderedList'), title: '글머리 기호' },
      { label: '1. OL', action: () => exec('insertOrderedList'), title: '번호 매기기' },
    ],
    [
      { label: '\u201C\u201D', action: () => handleHeading('blockquote'), title: '인용문' },
      { label: '<>', action: () => {
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, '<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;overflow-x:auto;"><code>\n</code></pre>');
        syncContent();
      }, title: '코드 블록' },
    ],
    [
      { label: '\uD83D\uDD17', action: handleLink, title: '링크 삽입' },
    ],
    [
      { label: 'align-left', action: () => exec('justifyLeft'), title: '왼쪽 정렬' },
      { label: 'align-center', action: () => exec('justifyCenter'), title: '가운데 정렬' },
      { label: 'align-right', action: () => exec('justifyRight'), title: '오른쪽 정렬' },
    ],
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        border: `1px solid ${colors.border}`, borderBottom: 'none',
        borderRadius: '8px 8px 0 0', background: '#fafafa', alignItems: 'center',
      }}>
        {/* 1. B I U S */}
        {[
          { label: 'B', action: () => exec('bold'), title: '굵게', fw: 800, fs: 'normal' as const, td: 'none' },
          { label: 'I', action: () => exec('italic'), title: '기울임', fw: 600, fs: 'italic' as const, td: 'none' },
          { label: 'U', action: () => exec('underline'), title: '밑줄', fw: 600, fs: 'normal' as const, td: 'underline' },
          { label: 'S', action: () => exec('strikeThrough'), title: '취소선', fw: 600, fs: 'normal' as const, td: 'line-through' },
        ].map((btn, i) => (
          <button key={i} type="button" title={btn.title}
            onMouseDown={e => { e.preventDefault(); btn.action(); }}
            style={{ ...toolbarBtnStyle, fontWeight: btn.fw, fontStyle: btn.fs, textDecoration: btn.td }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e8e8e8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >{btn.label}</button>
        ))}
        {/* 2. Heading dropdown */}
        <div ref={headingDropdownRef} style={{ position: 'relative', marginLeft: 2 }}>
          <button type="button" title="소제목"
            onMouseDown={e => { e.preventDefault(); setShowHeadingDropdown(!showHeadingDropdown); }}
            style={{
              ...toolbarBtnStyle, display: 'flex', alignItems: 'center', gap: 3,
              padding: '5px 8px', minWidth: 64, justifyContent: 'center',
              border: `1px solid ${colors.border}`, borderRadius: 4, background: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{currentHeading}</span>
            <span style={{ fontSize: 8, color: colors.textLight }}>▾</span>
          </button>
          {showHeadingDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff',
              border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, minWidth: 150, padding: '4px 0',
            }}>
              {[
                { tag: 'p', label: '본문', size: 13, weight: 400 },
                { tag: 'h1', label: '제목 1', size: 20, weight: 800 },
                { tag: 'h2', label: '제목 2', size: 17, weight: 700 },
                { tag: 'h3', label: '제목 3', size: 15, weight: 700 },
                { tag: 'h4', label: '제목 4', size: 13, weight: 700 },
              ].map(h => (
                <button key={h.tag}
                  onMouseDown={e => { e.preventDefault(); applyHeading(h.tag, h.label); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: h.size, fontWeight: h.weight,
                    color: currentHeading === h.label ? colors.green : colors.text, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span>{h.label}</span>
                  {currentHeading === h.label && <span style={{ fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: colors.border, margin: '0 4px' }} />
        {/* Text color picker */}
        <div ref={textColorRef} style={{ position: 'relative' }}>
          <button type="button" title="글자색"
            onMouseDown={e => { e.preventDefault(); setShowTextColor(!showTextColor); }}
            style={{ ...toolbarBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: '4px 8px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e8e8e8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>A</span>
            <div style={{ width: 14, height: 3, borderRadius: 1, background: currentTextColor, marginTop: 1 }} />
          </button>
          {showTextColor && (
            <div style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4,
              background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, padding: 10,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {textColors.map(c => (
                  <button key={c}
                    onMouseDown={e => { e.preventDefault(); applyTextColor(c); }}
                    style={{
                      width: 24, height: 24, borderRadius: 3,
                      border: c === currentTextColor ? '2px solid #333' : (c === '#ffffff' || c === '#eeeeee' || c === '#dddddd' ? '1px solid #ccc' : '1px solid transparent'),
                      background: c, cursor: 'pointer', transition: 'transform 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: colors.border, margin: '0 4px' }} />
        {/* 3. Font size dropdown */}
        <div ref={fontSizeRef} style={{ position: 'relative', marginRight: 2 }}>
          <button type="button" title="글자 크기"
            onMouseDown={e => { e.preventDefault(); setShowFontSize(!showFontSize); }}
            style={{
              ...toolbarBtnStyle, display: 'flex', alignItems: 'center', gap: 3,
              padding: '5px 8px', minWidth: 48, justifyContent: 'center',
              border: `1px solid ${colors.border}`, borderRadius: 4, background: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <span style={{ fontSize: 12, fontWeight: 600 }}>{currentFontSize}</span>
            <span style={{ fontSize: 8, color: colors.textLight }}>▾</span>
          </button>
          {showFontSize && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff',
              border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, minWidth: 70, maxHeight: 280, overflowY: 'auto', padding: '4px 0',
            }}>
              {fontSizes.map(size => (
                <button key={size}
                  onMouseDown={e => { e.preventDefault(); applyFontSize(size); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '7px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: size === currentFontSize ? 700 : 400,
                    color: size === currentFontSize ? colors.green : colors.text, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span>{size}</span>
                  {size === currentFontSize && <span style={{ fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 4. Font family dropdown */}
        <div ref={fontFamilyRef} style={{ position: 'relative', marginRight: 2 }}>
          <button type="button" title="글꼴"
            onMouseDown={e => { e.preventDefault(); setShowFontFamily(!showFontFamily); }}
            style={{
              ...toolbarBtnStyle, display: 'flex', alignItems: 'center', gap: 3,
              padding: '5px 8px', minWidth: 80, justifyContent: 'center',
              border: `1px solid ${colors.border}`, borderRadius: 4, background: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 65 }}>{currentFontFamily}</span>
            <span style={{ fontSize: 8, color: colors.textLight }}>▾</span>
          </button>
          {showFontFamily && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff',
              border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, minWidth: 160, maxHeight: 320, overflowY: 'auto', padding: '4px 0',
            }}>
              {fontFamilies.map(font => (
                <button key={font.label}
                  onMouseDown={e => { e.preventDefault(); applyFontFamily(font); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: 13, fontFamily: font.value,
                    fontWeight: font.label === currentFontFamily ? 700 : 400,
                    color: font.label === currentFontFamily ? colors.green : colors.text, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span>{font.label}</span>
                  {font.label === currentFontFamily && <span style={{ fontSize: 14 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: colors.border, margin: '0 4px' }} />
        {/* 5. Remaining toolbar groups (UL, OL, quote, code, link, align) */}
        {toolbarGroups.map((group, gi, arr) => (
          <div key={gi} style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {group.map((btn, bi) => (
              <button key={bi} type="button" title={btn.title}
                onMouseDown={e => { e.preventDefault(); btn.action(); }}
                style={toolbarBtnStyle}
                onMouseEnter={e => (e.currentTarget.style.background = '#e8e8e8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {btn.label === 'align-left' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                ) : btn.label === 'align-center' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                ) : btn.label === 'align-right' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                ) : btn.label}
              </button>
            ))}
            {gi < arr.length - 1 && (
              <div style={{ width: 1, height: 20, background: colors.border, margin: '0 4px' }} />
            )}
          </div>
        ))}
        {/* Insert (+) menu button */}
        <div style={{ width: 1, height: 20, background: colors.border, margin: '0 4px' }} />
        <div ref={insertMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            title="미디어 삽입"
            onMouseDown={e => { e.preventDefault(); setShowInsertMenu(!showInsertMenu); }}
            style={{ ...toolbarBtnStyle, fontSize: 18, fontWeight: 800, lineHeight: 1, padding: '4px 10px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e8e8e8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            +
          </button>
          {showInsertMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff',
              border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 100, minWidth: 180, overflow: 'hidden',
            }}>
              {[
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                  label: '이미지', desc: '이미지 파일 업로드',
                  action: () => { fileInputRef.current?.click(); setShowInsertMenu(false); },
                },
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
                  label: '유튜브 동영상', desc: '유튜브 링크로 삽입',
                  action: handleVideoInsert,
                },
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
                  label: '동영상 파일', desc: '동영상 파일 업로드',
                  action: () => { videoInputRef.current?.click(); setShowInsertMenu(false); },
                },
                {
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                  label: '파일 첨부', desc: 'PDF, 문서 등 첨부',
                  action: () => { fileUploadRef.current?.click(); setShowInsertMenu(false); },
                },
              ].map((item, i) => (
                <button key={i} onMouseDown={e => { e.preventDefault(); item.action(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ color: colors.textLight, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: colors.textLight, marginTop: 1 }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Google Fonts for editor */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gothic+A1:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap" />
      {/* Editor media hover styles */}
      <style>{`
        [contenteditable] img { cursor: pointer; transition: outline 0.15s; border-radius: 4px; }
        [contenteditable] img:hover { outline: 2px solid #3b82f6; outline-offset: 2px; }
        [contenteditable] div[contenteditable="false"] { cursor: pointer; transition: outline 0.15s; border-radius: 4px; }
        [contenteditable] div[contenteditable="false"]:hover { outline: 2px solid #3b82f6; outline-offset: 2px; }
      `}</style>
      {/* Editor Area */}
      <div style={{ position: 'relative' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          style={{
            minHeight: 400, padding: '16px 18px', fontSize: 15, lineHeight: 1.8,
            border: `1px solid ${colors.border}`, borderRadius: '0 0 8px 8px',
            outline: 'none', background: '#fff', fontFamily: 'inherit',
            overflowY: 'auto',
          }}
          data-placeholder="본문을 작성하세요..."
        />

        {/* Image resize overlay */}
        {selectedImg && imgRect && (
          <div className="img-resize-overlay" style={{ position: 'absolute', top: imgRect.top, left: imgRect.left, width: imgRect.width, height: imgRect.height, pointerEvents: 'none', zIndex: 10 }}>
            {/* Border */}
            <div style={{ position: 'absolute', inset: 0, border: '2px solid #3b82f6', borderRadius: 2, pointerEvents: 'none' }} />
            {/* Alignment toolbar */}
            <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2, background: '#1a1a1a', borderRadius: 6, padding: '4px 6px', pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); alignImage(a); }} style={{ width: 28, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  {a === 'left' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="14" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                  : a === 'center' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>}
                </button>
              ))}
              <div style={{ width: 1, height: 16, background: '#555', margin: '0 2px' }} />
              {/* Rotate left */}
              <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); rotateImage(270); }}
                style={{ width: 28, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                title="왼쪽 회전"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
              {/* Rotate right */}
              <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); rotateImage(90); }}
                style={{ width: 28, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                title="오른쪽 회전"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
              </button>
              {/* Text overlay */}
              <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); addTextOverlay(); }}
                style={{ width: 28, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#444')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                title="텍스트 추가"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 3v18"/><path d="M5 6V3h14v3"/></svg>
              </button>
              <div style={{ width: 1, height: 16, background: '#555', margin: '0 2px' }} />
              <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); deleteSelectedMedia(); }}
                style={{ width: 28, height: 24, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6666', fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#442222')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                title="삭제"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            {/* Size display */}
            <div style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              {Math.round(imgRect.width)} × {Math.round(imgRect.height)}
            </div>
            {/* Resize handles */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(h => (
              <div key={h} onMouseDown={startResize(h)} style={{
                position: 'absolute', width: 10, height: 10, background: '#3b82f6', border: '2px solid #fff', borderRadius: 2, pointerEvents: 'auto', cursor: h.includes('left') ? (h.includes('top') ? 'nw-resize' : 'sw-resize') : (h.includes('top') ? 'ne-resize' : 'se-resize'),
                ...(h.includes('top') ? { top: -5 } : { bottom: -5 }),
                ...(h.includes('left') ? { left: -5 } : { right: -5 }),
              }} />
            ))}
            {/* Edge handles */}
            {['right', 'bottom', 'left', 'top'].map(h => (
              <div key={h} onMouseDown={startResize(h)} style={{
                position: 'absolute', pointerEvents: 'auto', background: '#3b82f6', borderRadius: 1,
                ...(h === 'right' ? { right: -3, top: '50%', transform: 'translateY(-50%)', width: 4, height: 24, cursor: 'ew-resize' } :
                  h === 'left' ? { left: -3, top: '50%', transform: 'translateY(-50%)', width: 4, height: 24, cursor: 'ew-resize' } :
                  h === 'bottom' ? { bottom: -3, left: '50%', transform: 'translateX(-50%)', width: 24, height: 4, cursor: 'ns-resize' } :
                  { top: -3, left: '50%', transform: 'translateX(-50%)', width: 24, height: 4, cursor: 'ns-resize' }),
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
      <input ref={fileUploadRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />

      {/* YouTube embed modal */}
      {showYoutubeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setShowYoutubeModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>유튜브 동영상 삽입</div>
                <div style={{ fontSize: 12, color: colors.textLight }}>유튜브 링크를 붙여넣으면 미리보기가 표시됩니다</div>
              </div>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => handleYoutubeUrlChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmYoutubeInsert()}
              style={{
                width: '100%', padding: '12px 16px', fontSize: 14, border: `2px solid ${youtubeError ? colors.red : youtubePreviewId ? colors.green : colors.border}`,
                borderRadius: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
            {youtubeError && <div style={{ fontSize: 12, color: colors.red, marginTop: 6 }}>{youtubeError}</div>}

            {youtubePreviewId && (
              <div style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${youtubePreviewId}`}
                  frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setShowYoutubeModal(false)}
                style={{ ...s.btn, ...s.btnOutline, padding: '10px 24px', fontSize: 13, borderRadius: 8 }}
              >취소</button>
              <button
                onClick={confirmYoutubeInsert}
                disabled={!youtubePreviewId}
                style={{
                  ...s.btn, padding: '10px 24px', fontSize: 13, borderRadius: 8, fontWeight: 700,
                  background: youtubePreviewId ? colors.text : '#ccc', color: '#fff', border: 'none',
                  cursor: youtubePreviewId ? 'pointer' : 'not-allowed',
                }}
              >삽입</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── HTML to Portable Text converter ──
function htmlToPortableText(html: string): any[] {
  if (!html || !html.trim()) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: any[] = [];
  let blockKeyCounter = 0;

  const genKey = () => {
    blockKeyCounter++;
    return `block_${blockKeyCounter}_${Date.now().toString(36)}`;
  };

  const extractMarks = (node: Node): string[] => {
    const marks: string[] = [];
    let el = node.parentElement;
    while (el && el !== doc.body) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'strong' || tag === 'b') marks.push('strong');
      if (tag === 'em' || tag === 'i') marks.push('em');
      if (tag === 'u') marks.push('underline');
      if (tag === 'code') marks.push('code');
      el = el.parentElement;
    }
    return [...new Set(marks)];
  };

  const processInlineChildren = (parent: Element): any[] => {
    const spans: any[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text) {
          spans.push({ _type: 'span', _key: genKey(), text, marks: extractMarks(node) });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === 'img') {
          const src = el.getAttribute('src') || '';
          if (src) {
            // Images become their own block (handled separately), push placeholder
            spans.push({ _type: 'span', _key: genKey(), text: '', marks: [] });
          }
        } else if (tag === 'a') {
          const href = el.getAttribute('href') || '';
          const linkKey = genKey();
          const childSpans: any[] = [];
          el.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              childSpans.push({
                _type: 'span', _key: genKey(),
                text: child.textContent || '',
                marks: [...extractMarks(child), linkKey],
              });
            }
          });
          if (childSpans.length === 0) {
            childSpans.push({ _type: 'span', _key: genKey(), text: el.textContent || href, marks: [linkKey] });
          }
          spans.push({ _markDef: { _type: 'link', _key: linkKey, href }, children: childSpans });
        } else if (tag === 'br') {
          spans.push({ _type: 'span', _key: genKey(), text: '\n', marks: [] });
        } else {
          el.childNodes.forEach(child => walk(child));
        }
      }
    };
    parent.childNodes.forEach(child => walk(child));
    return spans;
  };

  const processElement = (el: Element) => {
    const tag = el.tagName.toLowerCase();

    // Images become image blocks
    if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      if (src) {
        blocks.push({
          _type: 'image',
          _key: genKey(),
          asset: { _type: 'reference', _ref: src },
          url: src,
        });
      }
      return;
    }

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else {
          children.push(item);
        }
      });
      blocks.push({
        _type: 'block', _key: genKey(), style: tag, markDefs,
        children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: '', marks: [] }],
      });
      return;
    }

    // Lists (ul / ol)
    if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ul' ? 'bullet' : 'number';
      el.querySelectorAll(':scope > li').forEach(li => {
        const inlines = processInlineChildren(li);
        const markDefs: any[] = [];
        const children: any[] = [];
        inlines.forEach(item => {
          if (item._markDef) {
            markDefs.push(item._markDef);
            children.push(...item.children);
          } else {
            children.push(item);
          }
        });
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', listItem, level: 1, markDefs,
          children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: li.textContent || '', marks: [] }],
        });
      });
      return;
    }

    // Blockquote
    if (tag === 'blockquote') {
      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else {
          children.push(item);
        }
      });
      blocks.push({
        _type: 'block', _key: genKey(), style: 'blockquote', markDefs,
        children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: el.textContent || '', marks: [] }],
      });
      return;
    }

    // Code block (pre)
    if (tag === 'pre') {
      blocks.push({
        _type: 'block', _key: genKey(), style: 'normal', markDefs: [],
        children: [{ _type: 'span', _key: genKey(), text: el.textContent || '', marks: ['code'] }],
      });
      return;
    }

    // Regular paragraphs / divs / other block elements
    if (['p', 'div', 'section', 'article'].includes(tag) || tag === 'span') {
      // Check if this contains only an image
      const imgs = el.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src) {
          blocks.push({ _type: 'image', _key: genKey(), asset: { _type: 'reference', _ref: src }, url: src });
        }
      });

      const inlines = processInlineChildren(el);
      const markDefs: any[] = [];
      const children: any[] = [];
      inlines.forEach(item => {
        if (item._markDef) {
          markDefs.push(item._markDef);
          children.push(...item.children);
        } else if (item.text !== '' || children.length === 0) {
          children.push(item);
        }
      });

      // Only add text block if there is actual text content
      const hasText = children.some(c => c.text && c.text.trim());
      if (hasText) {
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', markDefs,
          children: children.length > 0 ? children : [{ _type: 'span', _key: genKey(), text: '', marks: [] }],
        });
      }
      return;
    }
  };

  // Process top-level nodes
  doc.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        blocks.push({
          _type: 'block', _key: genKey(), style: 'normal', markDefs: [],
          children: [{ _type: 'span', _key: genKey(), text, marks: [] }],
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      processElement(node as Element);
    }
  });

  return blocks.length > 0 ? blocks : [{ _type: 'block', _key: genKey(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: genKey(), text: '', marks: [] }] }];
}

// ── Portable Text to HTML (for loading existing posts) ──
function portableTextToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  return blocks.map(block => {
    if (block._type === 'image') {
      const url = block.url || block.asset?.url || '';
      return url ? `<img src="${url}" alt="" style="max-width:100%;height:auto;margin:8px 0;" />` : '';
    }
    if (block._type !== 'block') return '';
    const children = (block.children || []).map((span: any) => {
      let text = (span.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const marks = span.marks || [];
      if (marks.includes('strong')) text = `<strong>${text}</strong>`;
      if (marks.includes('em')) text = `<em>${text}</em>`;
      if (marks.includes('underline')) text = `<u>${text}</u>`;
      if (marks.includes('code')) text = `<code>${text}</code>`;
      // Handle link marks
      const linkMark = marks.find((m: string) => {
        return (block.markDefs || []).some((md: any) => md._key === m && md._type === 'link');
      });
      if (linkMark) {
        const def = (block.markDefs || []).find((md: any) => md._key === linkMark);
        if (def) text = `<a href="${def.href}">${text}</a>`;
      }
      return text;
    }).join('');

    const style = block.style || 'normal';
    if (block.listItem === 'bullet') return `<li>${children}</li>`;
    if (block.listItem === 'number') return `<li>${children}</li>`;
    if (style === 'blockquote') return `<blockquote>${children}</blockquote>`;
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(style)) return `<${style}>${children}</${style}>`;
    return `<p>${children}</p>`;
  }).join('\n');
}

// ══════════════════════════════════════
// ── Blog Editor Page ──
// ══════════════════════════════════════
function BlogEditor({ postId, onNavigate }: { postId?: string; onNavigate: (page: string) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(postId);
  const [toastMsg, setToastMsg] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedEditorImg, setSelectedEditorImg] = useState<HTMLImageElement | null>(null);
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgLink, setImgLink] = useState('');
  const editorBodyRef = useRef<{ syncContent: () => void } | null>(null);
  const [form, setForm] = useState({
    title: '', excerpt: '', body: '', focusKeyword: '', seoTitle: '', seoDescription: '',
    categoryId: '', tags: [] as string[], tagInput: '', publishedAt: '',
  });

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchBlogTemplates().then(setTemplates).catch(() => {});
    if (postId) {
      fetchBlogPost(postId).then((post: any) => {
        if (post) {
          // Convert Portable Text body to HTML for the rich editor
          let bodyHtml = '';
          if (post.body && Array.isArray(post.body)) {
            bodyHtml = portableTextToHtml(post.body);
          } else if (typeof post.body === 'string') {
            bodyHtml = post.body;
          }
          setForm({
            title: post.title || '', excerpt: post.excerpt || '', body: bodyHtml,
            focusKeyword: post.focusKeyword || '', seoTitle: post.seoTitle || '', seoDescription: post.seoDescription || '',
            categoryId: post.category?._id || '', tags: post.tags || [], tagInput: '',
            publishedAt: post.publishedAt ? post.publishedAt.split('T')[0] : '',
          });
        }
      });
    }
  }, [postId]);

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, prev.tagInput.trim()], tagInput: '' }));
    }
  };

  const removeTag = (tag: string) => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      // Convert HTML body to Sanity Portable Text blocks
      const bodyBlocks = htmlToPortableText(form.body);

      const data: any = {
        title: form.title,
        excerpt: form.excerpt,
        body: bodyBlocks,
        focusKeyword: form.focusKeyword,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        tags: form.tags,
        ...(form.categoryId && { category: { _type: 'reference', _ref: form.categoryId } }),
        ...(publish && { publishedAt: form.publishedAt || new Date().toISOString() }),
      };

      if (currentPostId) {
        await updateBlogPost(currentPostId, data);
      } else {
        data.slug = { _type: 'slug', current: form.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-') };
        const created = await createBlogPost(data);
        if (created?._id) setCurrentPostId(created._id);
      }

      if (publish) {
        showToast('발행되었습니다!');
        setTimeout(() => onNavigate('blogs'), 1000);
      } else {
        showToast('임시저장 완료!');
      }
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const scores = calculateScores({
    title: form.title, excerpt: form.excerpt, body: form.body,
    focusKeyword: form.focusKeyword, seoTitle: form.seoTitle,
    seoDesc: form.seoDescription, tags: form.tags, category: form.categoryId,
    slug: form.title ? form.title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-') : '',
  });

  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const mainImageRef = useRef<HTMLInputElement>(null);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageUploading(true);
    try {
      const asset = await uploadImage(file);
      setMainImageUrl(asset.url);
      updateField('mainImageRef', asset._id);
    } catch (err: any) {
      alert('이미지 업로드 실패: ' + err.message);
    } finally {
      setMainImageUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast message */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease' }}>
          {toastMsg}
        </div>
      )}

      {/* Back link */}
      <button onClick={() => onNavigate('blogs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: colors.textLight, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{'<'}</span> 글 목록으로
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* ── Left: Title + Slug + Editor ── */}
        <div>
          {/* Title */}
          <input
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="제목을 입력하세요"
            style={{ width: '100%', fontSize: 24, fontWeight: 800, border: `1px solid ${colors.border}`, borderRadius: 8, outline: 'none', padding: '14px 16px', marginBottom: 10, color: colors.text, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
          />

          {/* Slug */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, fontSize: 13, color: colors.textLight }}>
            <span style={{ fontWeight: 600 }}>/blog/</span>
            <input
              value={form.title ? form.title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-') : ''}
              readOnly
              style={{ border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, color: colors.textLight, flex: 1, outline: 'none', background: '#fafafa' }}
            />
          </div>

          {/* Rich Text Editor */}
          <RichTextEditor value={form.body} onChange={(html) => updateField('body', html)} onImageSelect={(img) => {
            setSelectedEditorImg(img);
            if (img && img.tagName === 'IMG') {
              setImgAlt(img.getAttribute('alt') || '');
              // Check for caption (div.img-caption inside figure wrapper)
              const wrapper = img.closest('.img-overlay-wrapper');
              const container = wrapper || img;
              const figureWrapper = container.closest('.img-figure-wrapper');
              const captionEl = figureWrapper?.querySelector('.img-caption');
              setImgCaption(captionEl?.textContent || '');
              // Check for link
              const link = img.closest('a');
              setImgLink(link?.getAttribute('href') || '');
            } else {
              setImgAlt('');
              setImgCaption('');
              setImgLink('');
            }
          }} />
        </div>

        {/* ── Right: Sidebar Panels ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Image Settings Panel (replaces SEO when image selected) */}
          {selectedEditorImg && selectedEditorImg.tagName === 'IMG' ? (
            <div style={s.card} className="image-settings-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: colors.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>이미지 설정</div>
                  <div style={{ fontSize: 10, color: colors.textLight }}>다른 곳을 클릭하면 SEO 분석으로 돌아갑니다</div>
                </div>
              </div>

              {/* Preview thumbnail */}
              <div style={{ marginBottom: 14, borderRadius: 8, overflow: 'hidden', border: `1px solid ${colors.border}`, background: '#f5f5f5' }}>
                <img src={selectedEditorImg.src} style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'contain' }} />
              </div>

              {/* Alt text */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                  이미지 설명 (Alt Text)
                  <span style={{ fontSize: 9, fontWeight: 500, color: '#fff', background: colors.green, padding: '1px 5px', borderRadius: 3 }}>SEO</span>
                </label>
                <input
                  type="text"
                  placeholder="검색엔진이 이미지를 이해할 수 있도록 설명을 입력하세요"
                  value={imgAlt}
                  onChange={e => {
                    setImgAlt(e.target.value);
                    selectedEditorImg.setAttribute('alt', e.target.value);
                  }}
                  style={{ ...s.input, fontSize: 12, padding: '8px 10px' }}
                />
              </div>

              {/* Caption */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4, display: 'block' }}>
                  캡션
                </label>
                <input
                  type="text"
                  placeholder="이미지 하단 설명 (선택)"
                  value={imgCaption}
                  onChange={e => {
                    setImgCaption(e.target.value);
                    const wrapper = selectedEditorImg.closest('.img-overlay-wrapper');
                    const imgEl = wrapper || selectedEditorImg;
                    // Look for figure wrapper that holds image + caption together
                    let figureEl = imgEl.closest('.img-figure-wrapper') as HTMLElement | null;
                    let captionEl = figureEl?.querySelector('.img-caption') as HTMLElement | null;

                    if (e.target.value) {
                      // Create figure wrapper if not exists
                      if (!figureEl) {
                        figureEl = document.createElement('div');
                        figureEl.className = 'img-figure-wrapper';
                        figureEl.style.cssText = 'display:block;margin:8px 0;max-width:100%;';
                        imgEl.parentElement?.insertBefore(figureEl, imgEl);
                        figureEl.appendChild(imgEl);
                      }
                      if (!captionEl) {
                        captionEl = document.createElement('div');
                        captionEl.className = 'img-caption';
                        captionEl.style.cssText = 'text-align:center;font-size:13px;color:#888;margin-top:4px;padding:2px 0;';
                        figureEl.appendChild(captionEl);
                      }
                      captionEl.textContent = e.target.value;
                    } else {
                      if (captionEl) captionEl.remove();
                      // Unwrap figure if only image remains
                      if (figureEl && !figureEl.querySelector('.img-caption')) {
                        figureEl.parentElement?.insertBefore(imgEl, figureEl);
                        figureEl.remove();
                      }
                    }
                    updateField('body', document.querySelector('[contenteditable]')?.innerHTML || form.body);
                  }}
                  style={{ ...s.input, fontSize: 12, padding: '8px 10px' }}
                />
              </div>

              {/* Link */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4, display: 'block' }}>
                  클릭 시 이동 링크
                </label>
                <input
                  type="text"
                  placeholder="https://example.com (선택)"
                  value={imgLink}
                  onChange={e => {
                    setImgLink(e.target.value);
                    const existingLink = selectedEditorImg.closest('a');
                    if (e.target.value) {
                      if (existingLink) {
                        existingLink.setAttribute('href', e.target.value);
                      } else {
                        const a = document.createElement('a');
                        a.href = e.target.value;
                        a.target = '_blank';
                        a.rel = 'noopener';
                        selectedEditorImg.parentElement?.insertBefore(a, selectedEditorImg);
                        a.appendChild(selectedEditorImg);
                      }
                    } else {
                      if (existingLink) {
                        existingLink.parentElement?.insertBefore(selectedEditorImg, existingLink);
                        existingLink.remove();
                      }
                    }
                    updateField('body', document.querySelector('[contenteditable]')?.innerHTML || form.body);
                  }}
                  style={{ ...s.input, fontSize: 12, padding: '8px 10px' }}
                />
              </div>

              {/* Image info */}
              <div style={{ fontSize: 11, color: colors.textLight, padding: '8px 0', borderTop: `1px solid ${colors.border}` }}>
                <div>크기: {selectedEditorImg.naturalWidth} x {selectedEditorImg.naturalHeight}px</div>
              </div>
            </div>
          ) : (
          /* SEO/GEO Score Panel */
          <div style={s.card}>
            {/* Score header with circles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
              <ScoreCircle score={scores.seoScore} label="SEO" size={48} />
              <ScoreCircle score={scores.totalScore} label="종합" size={64} />
              <ScoreCircle score={scores.geoScore} label="GEO" size={48} />
            </div>

            {/* SEO Categories */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: colors.text, marginBottom: 4, letterSpacing: '0.02em' }}>
                SEO 분석 <span style={{ fontWeight: 400, color: colors.textLight }}>({scores.seoScore}/100)</span>
              </div>
              {scores.seoCategories.map((cat, i) => (
                <ScoreCategoryPanel key={i} category={cat} defaultOpen={cat.failCount > 0 && i === 0} />
              ))}
            </div>

            {/* GEO Categories */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `2px solid ${colors.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: colors.text, marginBottom: 4, letterSpacing: '0.02em' }}>
                GEO 분석 (AI 검색 최적화) <span style={{ fontWeight: 400, color: colors.textLight }}>({scores.geoScore}/100)</span>
              </div>
              {scores.geoCategories.map((cat, i) => (
                <ScoreCategoryPanel key={i} category={cat} defaultOpen={cat.failCount > 0 && i === 0} />
              ))}
            </div>
          </div>
          )}

          {/* Publish Panel */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>발행</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={{ ...s.btn, ...s.btnOutline, flex: 1, fontSize: 12 }}>{saving ? '...' : '임시저장'}</button>
              <button onClick={() => handleSave(true)} disabled={saving} style={{ ...s.btn, padding: '10px 20px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '2px solid #22c55e', background: '#fff', color: '#22c55e', cursor: 'pointer', flex: 1 }}>{saving ? '...' : '발행'}</button>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.orange }}>예약 발행</label>
              <input type="datetime-local" style={{ ...s.input, fontSize: 12, marginTop: 4 }} value={form.publishedAt} onChange={e => updateField('publishedAt', e.target.value)} />
            </div>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ ...s.btn, width: '100%', background: colors.text, color: '#fff', fontSize: 13, padding: '12px 0', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>저장</button>
          </div>

          {/* Template Panel */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>템플릿</h3>
              <button onClick={() => setShowTemplates(!showTemplates)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: colors.textLight }}>
                {showTemplates ? '접기 ▲' : '펼치기 ▼'}
              </button>
            </div>
            <button
              onClick={async () => {
                const name = prompt('템플릿 이름을 입력하세요:');
                if (!name) return;
                try {
                  const bodyBlocks = htmlToPortableText(form.body);
                  await createBlogTemplate({
                    title: name,
                    body: bodyBlocks,
                    excerpt: form.excerpt,
                    tags: form.tags,
                    focusKeyword: form.focusKeyword,
                    seoTitle: form.seoTitle,
                    seoDescription: form.seoDescription,
                    ...(form.categoryId && { category: { _type: 'reference', _ref: form.categoryId } }),
                  });
                  showToast('템플릿이 저장되었습니다!');
                  fetchBlogTemplates().then(setTemplates).catch(() => {});
                } catch (err: any) {
                  alert('템플릿 저장 실패: ' + err.message);
                }
              }}
              style={{ ...s.btn, ...s.btnOutline, width: '100%', fontSize: 11, padding: '8px 0', marginBottom: 8 }}
            >
              현재 글을 템플릿으로 저장
            </button>
            {showTemplates && (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {templates.length === 0 ? (
                  <div style={{ fontSize: 11, color: colors.textLight, textAlign: 'center', padding: 12 }}>저장된 템플릿이 없습니다</div>
                ) : templates.map((t: any) => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                    <button
                      onClick={() => {
                        let bodyHtml = '';
                        if (t.body && Array.isArray(t.body)) {
                          bodyHtml = portableTextToHtml(t.body);
                        } else if (typeof t.body === 'string') {
                          bodyHtml = t.body;
                        }
                        setForm(prev => ({
                          ...prev,
                          body: bodyHtml,
                          excerpt: t.excerpt || prev.excerpt,
                          tags: t.tags || prev.tags,
                          focusKeyword: t.focusKeyword || prev.focusKeyword,
                          seoTitle: t.seoTitle || prev.seoTitle,
                          seoDescription: t.seoDescription || prev.seoDescription,
                          categoryId: t.categoryId || prev.categoryId,
                        }));
                        showToast(`"${t.title}" 템플릿 적용!`);
                      }}
                      style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: colors.text, textAlign: 'left', padding: '2px 0' }}
                      title="클릭하여 적용"
                    >
                      📄 {t.title}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`"${t.title}" 템플릿을 삭제하시겠습니까?`)) return;
                        await deleteBlogTemplate(t._id);
                        fetchBlogTemplates().then(setTemplates).catch(() => {});
                        showToast('템플릿 삭제됨');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#ef4444', padding: '2px 4px' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>카테고리</h3>
            <select style={s.input} value={form.categoryId} onChange={e => updateField('categoryId', e.target.value)}>
              <option value="">카테고리 선택</option>
              {categories.map((cat: any) => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>태그</h3>
            <input style={s.input} value={form.tagInput} onChange={e => updateField('tagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="태그 입력 후 Enter" />
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.tags.map(tag => (
                  <span key={tag} style={{ ...s.badge, background: '#f0f0f0', cursor: 'pointer', fontSize: 11 }} onClick={() => removeTag(tag)}>#{tag} ✕</span>
                ))}
              </div>
            )}
          </div>

          {/* Main Image */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>대표 이미지</h3>
            <div
              onClick={() => mainImageRef.current?.click()}
              style={{ border: `2px dashed ${colors.border}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
            >
              {mainImageUrl ? (
                <img src={mainImageUrl} alt="대표 이미지" style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <div style={{ fontSize: 12, color: colors.textLight }}>{mainImageUploading ? '업로드 중...' : '이미지 선택'}</div>
                </>
              )}
            </div>
            <input ref={mainImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMainImageUpload} />
          </div>

          {/* SEO Settings */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>SEO 설정</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>포커스 키워드</label>
              <input style={s.input} value={form.focusKeyword} onChange={e => updateField('focusKeyword', e.target.value)} placeholder="예: 웨딩 촬영" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>SEO 제목</label>
              <input style={s.input} value={form.seoTitle} onChange={e => updateField('seoTitle', e.target.value)} placeholder="SEO 제목" />
              <span style={{ fontSize: 11, color: form.seoTitle.length > 60 ? colors.red : colors.textLight }}>{form.seoTitle.length}/60자</span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>SEO 설명</label>
              <textarea style={{ ...s.textarea, minHeight: 60 }} value={form.seoDescription} onChange={e => { updateField('seoDescription', e.target.value); updateField('excerpt', e.target.value); }} placeholder="검색 결과에 표시될 설명" />
              <span style={{ fontSize: 11, color: form.seoDescription.length > 160 ? colors.red : colors.textLight }}>{form.seoDescription.length}/160자</span>
            </div>
          </div>

          {/* Share Preview */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>공유 미리보기</h3>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 6 }}>카카오톡 / Facebook</div>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 6, padding: 12, marginBottom: 12, background: '#fafafa' }}>
              <div style={{ fontSize: 11, color: colors.textLight }}>pickypic.vercel.app</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '4px 0 2px' }}>{form.seoTitle || form.title || 'SEO 제목'}</div>
              <div style={{ fontSize: 11, color: colors.textLight }}>{form.seoDescription || '메타 설명이 여기에 표시됩니다.'}</div>
            </div>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 6 }}>Google 검색결과</div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0dab' }}>{form.seoTitle || form.title || 'SEO 제목'} - PICKYPIC</div>
              <div style={{ fontSize: 11, color: '#006621' }}>pickypic.vercel.app/blog/{form.title ? form.title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-') : 'post-slug'}</div>
              <div style={{ fontSize: 11, color: colors.textLight }}>{form.seoDescription || '메타 설명이 여기에 표시됩니다.'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Portfolio Manager ──
// ══════════════════════════════════════
function PortfolioManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', client: '' });

  const load = useCallback(() => {
    setLoading(true);
    fetchPortfolioItems().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const categoryOptions = [
    { value: 'modern-picky', label: 'Modern Picky' },
    { value: 'classic-picky', label: 'Classic Picky' },
    { value: 'urban-picky', label: 'Urban Picky' },
    { value: 'modern-mini', label: 'Modern Mini' },
    { value: 'urban-mini', label: 'Urban Mini' },
    { value: 'modern-retro', label: 'Modern Retro' },
    { value: 'urban-retro', label: 'Urban Retro' },
    { value: 'outdoor', label: 'Outdoor Picky' },
    { value: 'air', label: 'Air Picky' },
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form.title || !form.category) {
      alert('제목과 카테고리를 먼저 입력해주세요.');
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadImage(file);
      await createPortfolioItem({
        title: form.title, category: form.category, client: form.client,
        image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
        order: items.length, isVisible: true,
      });
      setForm({ title: '', category: '', client: '' });
      e.target.value = '';
      load();
      alert('포트폴리오가 추가되었습니다!');
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 항목을 삭제하시겠습니까?`)) {
      await deletePortfolioItem(id);
      load();
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>포트폴리오 관리</h1>
        <span style={{ fontSize: 13, color: colors.textLight }}>새 항목 {items.length}개 · 기존 {localPortfolioItems.length}개</span>
      </div>

      {/* Upload Form */}
      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📸 새 포트폴리오 추가</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={s.label}>제목 *</label>
            <input style={s.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="예: Netflix Korea x PICKYPIC" />
          </div>
          <div>
            <label style={s.label}>포토부스 모델 *</label>
            <select style={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">선택</option>
              {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>클라이언트</label>
            <input style={s.input} value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} placeholder="브랜드명" />
          </div>
          <div>
            <label style={{ ...s.btn, ...s.btnPrimary, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? '업로드 중...' : '이미지 선택'}
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> :
          items.map((item: any) => (
            <div key={item._id} style={{ ...s.card, padding: 0, overflow: 'hidden', position: 'relative' }}>
              {item.image?.asset?.url && (
                <img src={item.image.asset.url} alt={item.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              )}
              <div style={{ padding: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...s.badge, background: '#f0f0f0', fontSize: 10 }}>{item.category}</span>
                  <button onClick={() => handleDelete(item._id, item.title)} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Existing Local Portfolio */}
      <div style={{ ...s.card, marginTop: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📂 기존 포트폴리오 ({localPortfolioItems.length}개)</h3>
        <p style={{ fontSize: 11, color: colors.textLight, marginBottom: 16 }}>코드에 등록된 기존 포트폴리오입니다. 수정/삭제는 코드에서 관리됩니다.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {localPortfolioItems.map((item) => (
          <div key={item.id} style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
            <img src={item.image} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            <div style={{ padding: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <span style={{ ...s.badge, background: '#f0f0f0', fontSize: 10 }}>{item.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── FAQ Manager ──
// ══════════════════════════════════════
function FAQManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', page: 'home' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchFAQItems().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.question || !form.answer) { alert('질문과 답변을 모두 입력해주세요.'); return; }
    if (editId) {
      await updateFAQItem(editId, form);
    } else {
      await createFAQItem({ ...form, order: items.length });
    }
    setForm({ question: '', answer: '', page: 'home' });
    setEditId(null);
    load();
  };

  const handleEdit = (item: any) => {
    setEditId(item._id);
    setForm({ question: item.question, answer: item.answer, page: item.page });
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 FAQ를 삭제하시겠습니까?')) {
      await deleteFAQItem(id);
      load();
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>FAQ 관리</h1>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{editId ? '✏️ FAQ 수정' : '➕ 새 FAQ 추가'}</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={s.label}>질문</label>
              <input style={s.input} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="자주 묻는 질문을 입력하세요" />
            </div>
            <div>
              <label style={s.label}>페이지</label>
              <select style={s.input} value={form.page} onChange={e => setForm(p => ({ ...p, page: e.target.value }))}>
                <option value="home">홈페이지</option>
                <option value="rental">렌탈문의</option>
              </select>
            </div>
          </div>
          <div>
            <label style={s.label}>답변</label>
            <textarea style={s.textarea} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} placeholder="답변을 작성하세요" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} style={{ ...s.btn, ...s.btnPrimary }}>{editId ? '수정 완료' : '추가'}</button>
            {editId && <button onClick={() => { setEditId(null); setForm({ question: '', answer: '', page: 'home' }); }} style={{ ...s.btn, ...s.btnOutline }}>취소</button>}
          </div>
        </div>
      </div>

      {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        ['home', 'rental'].map(page => {
          const pageItems = items.filter((i: any) => i.page === page);
          if (pageItems.length === 0) return null;
          return (
            <div key={page} style={{ ...s.card, marginTop: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{page === 'home' ? '🏠 홈페이지' : '📋 렌탈문의'} FAQ ({pageItems.length}개)</h3>
              {pageItems.map((item: any, i: number) => (
                <div key={item._id} style={{ padding: '12px 0', borderBottom: i < pageItems.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Q. {item.question}</p>
                      <p style={{ fontSize: 12, color: colors.textLight, lineHeight: 1.5 }}>A. {item.answer}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button onClick={() => handleEdit(item)} style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11 }}>수정</button>
                      <button onClick={() => handleDelete(item._id)} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ── Category Manager ──
// ══════════════════════════════════════
function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={s.header}><h1 style={s.title}>카테고리 관리</h1></div>
      <div style={s.card}>
        {loading ? <p style={{ color: colors.textLight }}>로딩 중...</p> : (
          <table style={s.table}>
            <thead><tr><th style={s.th}>카테고리</th><th style={s.th}>글 수</th></tr></thead>
            <tbody>
              {categories.map((cat: any) => (
                <tr key={cat._id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{cat.title}</td>
                  <td style={s.td}>{cat.postCount}개</td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={2} style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>카테고리가 없습니다</td></tr>}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 11, color: colors.textLight, marginTop: 12 }}>* 카테고리 추가/삭제는 Sanity Studio(sanity.io)에서 관리할 수 있습니다.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Collaboration Manager ──
// ══════════════════════════════════════
function CollaborationManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [memo, setMemo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchCollaborationRequests().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateCollaborationRequest(id, { status });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 협업 신청을 삭제하시겠습니까?`)) {
      await deleteCollaborationRequest(id);
      if (detail?._id === id) setDetail(null);
      load();
    }
  };

  const handleMemoSave = async (id: string) => {
    await updateCollaborationRequest(id, { memo });
    alert('메모가 저장되었습니다.');
    load();
  };

  const exportExcel = () => {
    const filtered = getFiltered();
    const headers = ['신청일', '상태', '협업형태', '행사명', '사업자명', '담당자', '연락처', '이메일', '설치장소', '행사일정', '철거일정', '부스타입', '래핑', '촬영타입', '기타문의'];
    const rows = filtered.map((item: any) => [
      item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ko') : '-',
      item.status === 'pending' ? '대기' : item.status === 'in_progress' ? '진행중' : '완료',
      item.collaborationType || '', item.eventName || '', item.companyName || '',
      item.contactName || '', item.contactPhone || '', item.contactEmail || '',
      item.installLocation || '', item.eventSchedule || '', item.removalSchedule || '',
      item.boothType || '', item.wrapping || '', item.shootingType || '',
      item.additionalMessage || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `협업신청_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFiltered = () => {
    let filtered = items;
    if (filter !== 'all') filtered = filtered.filter((i: any) => i.status === filter);
    if (search) filtered = filtered.filter((i: any) =>
      [i.eventName, i.companyName, i.contactName, i.contactEmail, i.contactPhone]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );
    return filtered;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef9c3', color: colors.orange, label: '대기' },
      in_progress: { bg: '#dbeafe', color: colors.blue, label: '진행중' },
      completed: { bg: '#dcfce7', color: colors.green, label: '완료' },
    };
    const st = map[status] || map.pending;
    return <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>;
  };

  const filtered = getFiltered();
  const counts = {
    all: items.length,
    pending: items.filter((i: any) => i.status === 'pending').length,
    in_progress: items.filter((i: any) => i.status === 'in_progress').length,
    completed: items.filter((i: any) => i.status === 'completed').length,
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>협업신청 관리</h1>
        <button onClick={exportExcel} style={{ ...s.btn, ...s.btnPrimary }}>📥 엑셀 다운로드</button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: '전체' },
          { key: 'pending', label: '대기' },
          { key: 'in_progress', label: '진행중' },
          { key: 'completed', label: '완료' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ ...s.btn, ...(filter === f.key ? s.btnPrimary : s.btnOutline), padding: '6px 14px', fontSize: 12 }}>
            {f.label} ({counts[f.key as keyof typeof counts]})
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input style={{ ...s.input, width: 240 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색 (행사명, 사업자명, 담당자...)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 400px' : '1fr', gap: 16 }}>
        {/* Table */}
        <div style={s.card}>
          {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>상태</th>
                  <th style={s.th}>협업형태</th>
                  <th style={s.th}>행사명</th>
                  <th style={s.th}>사업자명</th>
                  <th style={s.th}>담당자</th>
                  <th style={s.th}>연락처</th>
                  <th style={s.th}>신청일</th>
                  <th style={s.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => (
                  <tr key={item._id} style={{ cursor: 'pointer', background: detail?._id === item._id ? '#fef9e7' : 'transparent' }} onClick={() => { setDetail(item); setMemo(item.memo || ''); }}>
                    <td style={s.td}>{statusBadge(item.status)}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.collaborationType || '-'}</td>
                    <td style={{ ...s.td, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.eventName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.companyName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.contactName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.contactPhone || '-'}</td>
                    <td style={{ ...s.td, fontSize: 11, color: colors.textLight }}>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ko') : '-'}</td>
                    <td style={s.td}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id, item.eventName || item.companyName); }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>협업 신청이 없습니다</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div style={{ ...s.card, position: 'sticky', top: 24, alignSelf: 'start', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>상세 정보</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {/* Status Change */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>상태 변경</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'pending', label: '대기' },
                  { value: 'in_progress', label: '진행중' },
                  { value: 'completed', label: '완료' },
                ].map(st => (
                  <button key={st.value} onClick={() => { handleStatusChange(detail._id, st.value); setDetail({ ...detail, status: st.value }); }}
                    style={{ ...s.btn, ...(detail.status === st.value ? s.btnPrimary : s.btnOutline), padding: '4px 12px', fontSize: 11 }}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Fields */}
            {[
              { label: '협업 형태', value: detail.collaborationType },
              { label: '행사명', value: detail.eventName },
              { label: '사업자명', value: detail.companyName },
              { label: '담당자', value: detail.contactName },
              { label: '연락처', value: detail.contactPhone },
              { label: '이메일', value: detail.contactEmail },
              { label: '설치 장소', value: detail.installLocation },
              { label: '행사 일정', value: detail.eventSchedule },
              { label: '철거 일정', value: detail.removalSchedule },
              { label: '부스 타입', value: detail.boothType },
              { label: '래핑', value: detail.wrapping },
              { label: '촬영 타입', value: detail.shootingType },
              { label: '기타 문의', value: detail.additionalMessage },
              { label: '신청일', value: detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('ko') : '-' },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 600 }}>{field.label}</span>
                <p style={{ fontSize: 13, color: colors.text, marginTop: 2, wordBreak: 'break-all' }}>{field.value || '-'}</p>
              </div>
            ))}

            {/* Memo */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <label style={s.label}>관리자 메모</label>
              <textarea style={{ ...s.textarea, minHeight: 80 }} value={memo} onChange={e => setMemo(e.target.value)} placeholder="내부 메모를 작성하세요" />
              <button onClick={() => handleMemoSave(detail._id)} style={{ ...s.btn, ...s.btnPrimary, marginTop: 8, width: '100%' }}>메모 저장</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Popup Banner Manager ──
// ══════════════════════════════════════
function PopupManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ linkUrl: '/rental', altText: '' });

  const load = useCallback(() => {
    setLoading(true);
    fetchPopupBanners().then(setBanners).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageAsset(file);
      await createPopupBanner({
        isActive: true,
        linkUrl: form.linkUrl || '/rental',
        altText: form.altText || '피키픽 포토부스',
        image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      });
      setForm({ linkUrl: '/rental', altText: '' });
      e.target.value = '';
      load();
      alert('팝업 배너가 추가되었습니다!');
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updatePopupBanner(id, { isActive: !current });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 팝업 배너를 삭제하시겠습니까?')) {
      await deletePopupBanner(id);
      load();
    }
  };

  return (
    <div>
      <div style={s.header}><h1 style={s.title}>팝업 관리</h1></div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🖼️ 새 팝업 배너 추가</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={s.label}>클릭 시 이동 페이지</label>
            <select style={s.input} value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))}>
              <option value="/">홈</option>
              <option value="/rental">렌탈문의</option>
              <option value="/collaboration">협업제안</option>
              <option value="/products">제품소개</option>
              <option value="/about">회사소개</option>
              <option value="/portfolio">포트폴리오</option>
              <option value="/blog">블로그</option>
              <option value="/shop">구매문의</option>
              <option value="/ai-personal-color">A.I 퍼스널컬러</option>
              <option value="/support">고객지원</option>
            </select>
          </div>
          <div>
            <label style={s.label}>이미지 설명 (접근성)</label>
            <input style={s.input} value={form.altText} onChange={e => setForm(p => ({ ...p, altText: e.target.value }))} placeholder="팝업 배너 설명" />
          </div>
          <div>
            <label style={{ ...s.btn, ...s.btnPrimary, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? '업로드 중...' : '이미지 선택'}
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {banners.map((banner: any) => (
            <div key={banner._id} style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
              {banner.image?.asset?.url && (
                <img src={banner.image.asset.url} alt={banner.altText} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ ...s.badge, background: banner.isActive ? '#dcfce7' : '#fee2e2', color: banner.isActive ? colors.green : colors.red }}>
                    {banner.isActive ? '활성화' : '비활성화'}
                  </span>
                  <span style={{ fontSize: 11, color: colors.textLight }}>{banner.linkUrl}</span>
                </div>
                <p style={{ fontSize: 12, color: colors.textLight, marginBottom: 12 }}>{banner.altText || '설명 없음'}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleActive(banner._id, banner.isActive)} style={{ ...s.btn, ...s.btnOutline, padding: '4px 12px', fontSize: 11, flex: 1 }}>
                    {banner.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => handleDelete(banner._id)} style={{ ...s.btn, ...s.btnDanger, padding: '4px 12px', fontSize: 11 }}>삭제</button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && <div style={{ ...s.card, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 팝업 배너가 없습니다</div>}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ── Download File Manager ──
// ══════════════════════════════════════
function DownloadManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ displayName: '', category: 'product', order: 0, linkedProducts: [] as string[] });

  const categoryLabels: Record<string, string> = {
    product: '제품 소개서',
    company: '회사 소개서',
    catalog: '카탈로그',
    etc: '기타',
  };

  const productOptions = [
    { value: 'modern-picky', label: 'Modern Picky (모던피키)' },
    { value: 'classic-picky', label: 'Classic Picky (클래식피키)' },
    { value: 'urban-picky', label: 'Urban Picky (어반피키)' },
    { value: 'modern-mini-picky', label: 'Modern Mini Picky (모던미니피키)' },
    { value: 'urban-mini-picky', label: 'Urban Mini Picky (어반미니피키)' },
    { value: 'modern-retro-picky', label: 'Modern Retro Picky (모던레트로피키)' },
    { value: 'urban-retro-picky', label: 'Urban Retro Picky (어반레트로피키)' },
    { value: 'outdoor-picky', label: 'Outdoor Picky (아웃도어피키)' },
    { value: 'air-picky', label: 'Air Picky (에어피키)' },
  ];

  const load = useCallback(() => {
    setLoading(true);
    fetchDownloadFiles().then(setFiles).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.displayName.trim()) {
      alert('표시 이름을 먼저 입력해주세요.');
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadFile(file);
      await createDownloadFile({
        displayName: form.displayName,
        category: form.category,
        isActive: true,
        order: form.order,
        linkedProducts: form.linkedProducts,
        file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
      });
      setForm({ displayName: '', category: 'product', order: 0, linkedProducts: [] });
      e.target.value = '';
      load();
      alert('파일이 등록되었습니다!');
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updateDownloadFile(id, { isActive: !current });
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 파일을 삭제하시겠습니까?')) {
      await deleteDownloadFile(id);
      load();
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>다운로드 파일 관리</h1>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📄 새 파일 등록</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={s.label}>표시 이름</label>
            <input style={s.input} value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="예: 레트로 피키 제품소개서" />
          </div>
          <div>
            <label style={s.label}>카테고리</label>
            <select style={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="product">제품 소개서</option>
              <option value="company">회사 소개서</option>
              <option value="catalog">카탈로그</option>
              <option value="etc">기타</option>
            </select>
          </div>
          <div>
            <label style={s.label}>순서</label>
            <input style={s.input} type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <label style={{ ...s.btn, ...s.btnPrimary, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
              {uploading ? '업로드 중...' : 'PDF 선택'}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        {form.category === 'product' && (
          <div style={{ marginTop: 16 }}>
            <label style={s.label}>연결 제품 (제품소개 페이지에서 해당 제품 선택 시 이 파일이 다운로드됩니다)</label>
            <select
              multiple
              style={{ ...s.input, height: 180 }}
              value={form.linkedProducts}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, o => o.value);
                setForm(p => ({ ...p, linkedProducts: selected }));
              }}
            >
              {productOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>Ctrl(Cmd) + 클릭으로 여러 제품을 선택할 수 있습니다</p>
          </div>
        )}
      </div>

      {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 40 }}>순서</th>
                <th style={s.th}>파일명</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>용량</th>
                <th style={s.th}>상태</th>
                <th style={{ ...s.th, width: 180 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 && (
                <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 파일이 없습니다</td></tr>
              )}
              {files.map((file: any) => (
                <tr key={file._id}>
                  <td style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>{file.order ?? 0}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>
                    {file.displayName}
                    {file.fileName && <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>{file.fileName}</div>}
                    {file.linkedProducts?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {file.linkedProducts.map((p: string) => (
                          <span key={p} style={{ ...s.badge, background: '#e0f2fe', color: '#0369a1', fontSize: 10 }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#f0f0f0', color: colors.text }}>{categoryLabels[file.category] || file.category}</span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12, color: colors.textLight }}>{formatSize(file.fileSize)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: file.isActive ? '#dcfce7' : '#fee2e2', color: file.isActive ? colors.green : colors.red }}>
                      {file.isActive ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {file.fileUrl && (
                        <a href={file.fileUrl} target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}>미리보기</a>
                      )}
                      <button onClick={() => toggleActive(file._id, file.isActive)} style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11 }}>
                        {file.isActive ? '비공개' : '공개'}
                      </button>
                      <button onClick={() => handleDelete(file._id)} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ── Settings Page ──
// ══════════════════════════════════════
function SettingsPage() {
  return (
    <div>
      <div style={s.header}><h1 style={s.title}>사이트 설정</h1></div>
      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔗 바로가기</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <a href="https://www.sanity.io/manage/project/7b9lcco4" target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, textDecoration: 'none', textAlign: 'center' }}>Sanity 프로젝트 관리 →</a>
          <a href="https://analytics.google.com" target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, textDecoration: 'none', textAlign: 'center' }}>Google Analytics →</a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, textDecoration: 'none', textAlign: 'center' }}>Google Search Console →</a>
        </div>
      </div>
      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>ℹ️ 사이트 정보</h3>
        <div style={{ fontSize: 13, color: colors.textLight, lineHeight: 1.8 }}>
          <p>도메인: picky-pic.com</p>
          <p>CMS: Sanity (프로젝트 ID: 7b9lcco4)</p>
          <p>프레임워크: Astro + Tailwind CSS</p>
          <p>호스팅: Vercel</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// ── Main Admin App ──
// ══════════════════════════════════════
export default function AdminApp() {
  const [page, setPage] = useState('dashboard');
  const [editId, setEditId] = useState<string | undefined>();

  const navigate = (p: string, id?: string) => {
    setPage(p);
    setEditId(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'blogs': return <BlogList onNavigate={navigate} />;
      case 'blog-new': return <BlogEditor onNavigate={navigate} />;
      case 'blog-edit': return <BlogEditor postId={editId} onNavigate={navigate} />;
      case 'collaboration': return <CollaborationManager />;
      case 'portfolio': return <PortfolioManager />;
      case 'faq': return <FAQManager />;
      case 'popup': return <PopupManager />;
      case 'downloads': return <DownloadManager />;
      case 'categories': return <CategoryManager />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <PasswordGate>
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, width: '100%', minWidth: 960 }}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarLogo}>PICKYPIC 관리자</div>
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.id === 'blogs' ? 'blogs' : item.id)}
                style={{
                  ...s.navItem,
                  ...(page === item.id || (item.id === 'blogs' && ['blogs', 'blog-new', 'blog-edit'].includes(page)) ? s.navItemActive : {}),
                }}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textLight }}>
            <a href="/" target="_blank" rel="noopener" style={{ color: colors.textLight, textDecoration: 'none' }}>🌐 사이트 보기</a>
          </div>
        </aside>

        {/* Main Content */}
        <main style={s.main}>{renderPage()}</main>
      </div>
    </PasswordGate>
  );
}
