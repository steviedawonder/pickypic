import { useState, useEffect, useCallback } from 'react';
import PasswordGate from './PasswordGate';
import {
  fetchDashboardStats, fetchBlogPosts, fetchBlogPost, fetchCategories,
  createBlogPost, updateBlogPost, deleteBlogPost,
  fetchPortfolioItems, createPortfolioItem, deletePortfolioItem, uploadImage,
  fetchFAQItems, createFAQItem, updateFAQItem, deleteFAQItem,
  fetchCollaborationRequests, updateCollaborationRequest, deleteCollaborationRequest,
  fetchPopupBanners, createPopupBanner, updatePopupBanner, deletePopupBanner, uploadImage as uploadImageAsset,
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

// ── SEO/GEO Score Calculator ──
function calculateScores(data: { title: string; excerpt: string; body: string; focusKeyword: string; seoTitle: string; tags: string[]; category: string }) {
  const { title, excerpt, body, focusKeyword, seoTitle, tags, category } = data;
  const bodyLen = body.replace(/\s/g, '').length;
  const kwCount = focusKeyword ? (body.match(new RegExp(focusKeyword, 'gi')) || []).length : 0;
  const kwDensity = bodyLen > 0 && focusKeyword ? (kwCount * focusKeyword.length / bodyLen * 100) : 0;
  const h2Count = (body.match(/^## /gm) || []).length;
  const hasLinks = /\[.*?\]\(.*?\)/.test(body) || /https?:\/\//.test(body);
  const definitiveCount = (body.match(/입니다|합니다|됩니다|있습니다/g) || []).length;

  const seoChecks = [
    { label: '제목에 키워드 포함', ok: !!focusKeyword && title.includes(focusKeyword), fix: '제목에 포커스 키워드를 넣어주세요.' },
    { label: '요약에 키워드 포함', ok: !!focusKeyword && excerpt.includes(focusKeyword), fix: '요약에 포커스 키워드를 넣어주세요.' },
    { label: '본문 600자 이상', ok: bodyLen >= 600, fix: `현재 ${bodyLen}자. 600자 이상 작성하세요.` },
    { label: '본문에 키워드 포함', ok: kwCount > 0, fix: '본문에 키워드를 자연스럽게 넣어주세요.' },
    { label: '키워드 밀도 0.5~3%', ok: kwDensity >= 0.5 && kwDensity <= 3, fix: `현재 ${kwDensity.toFixed(1)}%. 0.5~3%가 적절합니다.` },
    { label: '제목 10~60자', ok: title.length >= 10 && title.length <= 60, fix: `현재 ${title.length}자. 10~60자가 적절합니다.` },
    { label: '제목에 숫자 포함', ok: /\d/.test(title), fix: '숫자가 있는 제목은 클릭률이 높습니다.' },
    { label: 'SEO 제목 설정', ok: seoTitle.length >= 20, fix: 'SEO 설정에서 검색용 제목을 입력하세요.' },
    { label: '소제목(##) 2개 이상', ok: h2Count >= 2, fix: '## 소제목으로 글을 나누세요.' },
    { label: '요약 50~200자', ok: excerpt.length >= 50 && excerpt.length <= 200, fix: `현재 ${excerpt.length}자. 50~200자가 적절합니다.` },
    { label: '본문에 링크 포함', ok: hasLinks, fix: '관련 페이지 링크를 넣어주세요.' },
    { label: '태그 2개 이상', ok: tags.length >= 2, fix: '태그를 2개 이상 추가해주세요.' },
    { label: '카테고리 설정', ok: !!category, fix: '카테고리를 선택해주세요.' },
  ];

  const geoChecks = [
    { label: '명확한 팩트 서술 3문장+', ok: definitiveCount >= 3, fix: '"~입니다" 형식의 단정적 문장을 3개 이상 작성하세요.' },
    { label: 'Q&A 형식 포함', ok: /\?/.test(body) && body.includes('##'), fix: '소제목을 질문 형식으로 작성하세요.' },
    { label: '전문 용어/브랜드명 5개+', ok: (body.match(/[A-Z][a-z]+/g) || []).length >= 5, fix: '브랜드명, 제품명 등 고유명사를 사용하세요.' },
    { label: '콘텐츠 1,500자+', ok: bodyLen >= 1500, fix: `현재 ${bodyLen}자. 1,500자 이상이면 AI 검색에 유리합니다.` },
    { label: '소제목 3개+ (깊이 있는 글)', ok: h2Count >= 3, fix: '## 소제목 3개 이상으로 주제를 깊이 다루세요.' },
    { label: '요약문 80자+', ok: excerpt.length >= 80, fix: `현재 ${excerpt.length}자. 80자 이상의 상세 요약을 작성하세요.` },
    { label: '출처/링크 포함', ok: hasLinks, fix: '통계나 수치의 출처 링크를 넣어주세요.' },
    { label: '권위적 어조', ok: definitiveCount >= 5, fix: '"~일 수 있습니다" 대신 "~입니다"로 확신 있게 작성하세요.' },
  ];

  const seoScore = Math.round(seoChecks.filter(c => c.ok).length / seoChecks.length * 100);
  const geoScore = Math.round(geoChecks.filter(c => c.ok).length / geoChecks.length * 100);
  const totalScore = Math.round(seoScore * 0.6 + geoScore * 0.4);

  return { seoChecks, geoChecks, seoScore, geoScore, totalScore };
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
// ── Blog Editor Page ──
// ══════════════════════════════════════
function BlogEditor({ postId, onNavigate }: { postId?: string; onNavigate: (page: string) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', excerpt: '', body: '', focusKeyword: '', seoTitle: '', seoDescription: '',
    categoryId: '', tags: [] as string[], tagInput: '', publishedAt: '',
  });

  useEffect(() => {
    fetchCategories().then(setCategories);
    if (postId) {
      fetchBlogPost(postId).then((post: any) => {
        if (post) setForm({
          title: post.title || '', excerpt: post.excerpt || '', body: '', // body is Portable Text, simplified here
          focusKeyword: post.focusKeyword || '', seoTitle: post.seoTitle || '', seoDescription: post.seoDescription || '',
          categoryId: post.category?._id || '', tags: post.tags || [], tagInput: '',
          publishedAt: post.publishedAt ? post.publishedAt.split('T')[0] : '',
        });
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

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const data: any = {
        title: form.title,
        excerpt: form.excerpt,
        focusKeyword: form.focusKeyword,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        tags: form.tags,
        ...(form.categoryId && { category: { _type: 'reference', _ref: form.categoryId } }),
        ...(publish && { publishedAt: form.publishedAt || new Date().toISOString() }),
      };

      if (postId) {
        await updateBlogPost(postId, data);
      } else {
        data.slug = { _type: 'slug', current: form.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-') };
        await createBlogPost(data);
      }
      alert(publish ? '발행되었습니다!' : '저장되었습니다!');
      onNavigate('blogs');
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const scores = calculateScores({
    title: form.title, excerpt: form.excerpt, body: form.body,
    focusKeyword: form.focusKeyword, seoTitle: form.seoTitle,
    tags: form.tags, category: form.categoryId,
  });

  return (
    <div>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => onNavigate('blogs')} style={{ ...s.btn, ...s.btnOutline, padding: '6px 12px' }}>← 목록</button>
          <h1 style={s.title}>{postId ? '글 수정' : '새 글 작성'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleSave(false)} disabled={saving} style={{ ...s.btn, ...s.btnOutline }}>{saving ? '저장 중...' : '임시저장'}</button>
          <button onClick={() => handleSave(true)} disabled={saving} style={{ ...s.btn, ...s.btnPrimary }}>{saving ? '저장 중...' : '발행하기'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Left: Editor */}
        <div>
          <div style={s.card}>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>제목</label>
              <input style={s.input} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="글 제목을 입력하세요" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>요약 (미리보기)</label>
              <textarea style={{ ...s.textarea, minHeight: 60 }} value={form.excerpt} onChange={e => updateField('excerpt', e.target.value)} placeholder="글의 요약을 2~3줄로 작성하세요" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>본문 내용</label>
              <p style={{ fontSize: 11, color: colors.textLight, marginBottom: 8 }}>마크다운 형식: ## 소제목, **굵게**, - 목록, [링크](url)</p>
              <textarea style={{ ...s.textarea, minHeight: 400, fontFamily: 'monospace', fontSize: 14, lineHeight: 1.8 }} value={form.body} onChange={e => updateField('body', e.target.value)} placeholder="본문을 작성하세요..." />
            </div>
          </div>

          {/* SEO Settings */}
          <div style={s.card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔍 SEO 설정</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>포커스 키워드</label>
              <input style={s.input} value={form.focusKeyword} onChange={e => updateField('focusKeyword', e.target.value)} placeholder="이 글의 핵심 키워드" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>SEO 제목 (검색 결과에 표시)</label>
              <input style={s.input} value={form.seoTitle} onChange={e => updateField('seoTitle', e.target.value)} placeholder="검색엔진에 표시될 제목 (20~60자)" />
              <span style={{ fontSize: 11, color: form.seoTitle.length > 60 ? colors.red : colors.textLight }}>{form.seoTitle.length}/60자</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>SEO 설명</label>
              <textarea style={{ ...s.textarea, minHeight: 60 }} value={form.seoDescription} onChange={e => updateField('seoDescription', e.target.value)} placeholder="검색 결과에 표시될 설명 (120~155자)" />
              <span style={{ fontSize: 11, color: form.seoDescription.length > 155 ? colors.red : colors.textLight }}>{form.seoDescription.length}/155자</span>
            </div>
          </div>

          {/* Meta */}
          <div style={s.card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 분류 및 태그</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>카테고리</label>
              <select style={s.input} value={form.categoryId} onChange={e => updateField('categoryId', e.target.value)}>
                <option value="">선택하세요</option>
                {categories.map((cat: any) => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>태그</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...s.input, flex: 1 }} value={form.tagInput} onChange={e => updateField('tagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="태그 입력 후 Enter" />
                <button onClick={addTag} style={{ ...s.btn, ...s.btnOutline }}>추가</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.tags.map(tag => (
                  <span key={tag} style={{ ...s.badge, background: '#f0f0f0', cursor: 'pointer' }} onClick={() => removeTag(tag)}>#{tag} ✕</span>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>발행일</label>
              <input type="date" style={s.input} value={form.publishedAt} onChange={e => updateField('publishedAt', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: SEO/GEO Score Panel */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          <div style={s.card}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>SEO + GEO 점수</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              <ScoreCircle score={scores.seoScore} label="SEO" size={56} />
              <ScoreCircle score={scores.totalScore} label="종합" size={72} />
              <ScoreCircle score={scores.geoScore} label="GEO" size={56} />
            </div>

            {/* SEO Checks */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>기본 SEO ({scores.seoChecks.filter(c => c.ok).length}/{scores.seoChecks.length})</div>
              {scores.seoChecks.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, padding: '6px 0', fontSize: 11, alignItems: 'flex-start', borderBottom: `1px solid #f5f5f5` }}>
                  <span style={{ flexShrink: 0 }}>{c.ok ? '🟢' : '🔴'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: c.ok ? '#333' : '#555' }}>{c.label}</div>
                    {!c.ok && <div style={{ color: colors.orange, marginTop: 2 }}>💡 {c.fix}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* GEO Checks */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>GEO AI검색 ({scores.geoChecks.filter(c => c.ok).length}/{scores.geoChecks.length})</div>
              {scores.geoChecks.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, padding: '6px 0', fontSize: 11, alignItems: 'flex-start', borderBottom: `1px solid #f5f5f5` }}>
                  <span style={{ flexShrink: 0 }}>{c.ok ? '🟢' : '🔴'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: c.ok ? '#333' : '#555' }}>{c.label}</div>
                    {!c.ok && <div style={{ color: colors.orange, marginTop: 2 }}>💡 {c.fix}</div>}
                  </div>
                </div>
              ))}
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
            <label style={s.label}>클릭 시 이동 URL</label>
            <input style={s.input} value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="/rental" />
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
  const [files, setFiles] = useState<{ name: string; path: string; size: string }[]>([]);

  useEffect(() => {
    // public/pdf 폴더의 파일 목록 (코드에서 관리)
    const knownFiles = [
      { name: '어반 미니 (Urban Mini)', path: '/pdf/pickypic_urban_mini.pdf', size: '-' },
      { name: '모던 미니 (Modern Mini)', path: '/pdf/pickypic_modern_mini.pdf', size: '-' },
      { name: '모던 피키 (Modern Picky)', path: '/pdf/pickypic_modern_picky.pdf', size: '-' },
      { name: '에어 피키 (Air Picky)', path: '/pdf/pickypic_air_picky.pdf', size: '-' },
      { name: '키오스크 (Kiosk)', path: '/pdf/pickypic_kiosk.pdf', size: '-' },
    ];
    setFiles(knownFiles);
  }, []);

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>다운로드 파일 관리</h1>
      </div>

      <div style={s.card}>
        <p style={{ fontSize: 13, color: colors.textLight, marginBottom: 16 }}>
          고객지원 페이지에서 다운로드 가능한 제품 소개서 파일 목록입니다.<br/>
          파일 추가/삭제는 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>public/pdf/</code> 폴더에서 관리합니다.
        </p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>파일명</th>
              <th style={s.th}>경로</th>
              <th style={s.th}>미리보기</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => (
              <tr key={i}>
                <td style={{ ...s.td, fontWeight: 600 }}>{file.name}</td>
                <td style={{ ...s.td, fontSize: 12, color: colors.textLight }}>{file.path}</td>
                <td style={s.td}>
                  <a href={file.path} target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, padding: '4px 12px', fontSize: 11, textDecoration: 'none' }}>열기 →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📝 파일 추가 방법</h3>
        <div style={{ fontSize: 13, color: colors.textLight, lineHeight: 1.8 }}>
          <p>1. PDF 파일을 <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>public/pdf/</code> 폴더에 추가</p>
          <p>2. 고객지원 페이지 코드에 파일 정보 등록</p>
          <p>3. 커밋 & 배포</p>
        </div>
      </div>
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
