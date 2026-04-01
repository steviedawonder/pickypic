import { useState, useEffect, useRef } from 'react';
import { colors, s } from '../shared/styles';
import { calculateScores } from '../shared/seoScoring';
import { ScoreCategoryPanel, ScoreCircle } from '../shared/SeoComponents';
import { htmlToPortableText, portableTextToHtml } from '../shared/portableText';
import {
  fetchCategories, fetchBlogPost, fetchBlogTemplates,
  createBlogPost, updateBlogPost, createBlogTemplate, deleteBlogTemplate,
  uploadImage,
} from '../adminClient';
import RichTextEditor from './RichTextEditor';

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
          if (post.mainImage?.asset?.url) {
            setMainImageUrl(post.mainImage.asset.url);
          }
          if (post.mainImage?.asset?._id) {
            setMainImageRefId(post.mainImage.asset._id);
          }
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

      // Add mainImage reference if it exists
      if (mainImageRef_id) {
        data.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: mainImageRef_id } };
      }

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
  const [mainImageRef_id, setMainImageRefId] = useState('');
  const mainImageRef = useRef<HTMLInputElement>(null);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageUploading(true);
    try {
      const asset = await uploadImage(file);
      setMainImageUrl(asset.url);
      setMainImageRefId(asset._id);
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
                        figureEl.style.cssText = 'display:inline-block;margin:8px 0;max-width:100%;vertical-align:top;';
                        imgEl.parentElement?.insertBefore(figureEl, imgEl);
                        figureEl.appendChild(imgEl);
                      }
                      if (!captionEl) {
                        captionEl = document.createElement('div');
                        captionEl.className = 'img-caption';
                        captionEl.style.cssText = 'text-align:center;font-size:13px;color:#888;margin:0;padding:2px 0;word-wrap:break-word;overflow-wrap:break-word;';
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
              <div style={{ fontSize: 11, color: colors.textLight }}>picky-pic.com</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: '4px 0 2px' }}>{form.seoTitle || form.title || 'SEO 제목'}</div>
              <div style={{ fontSize: 11, color: colors.textLight }}>{form.seoDescription || '메타 설명이 여기에 표시됩니다.'}</div>
            </div>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 6 }}>Google 검색결과</div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0dab' }}>{form.seoTitle || form.title || 'SEO 제목'} - PICKYPIC</div>
              <div style={{ fontSize: 11, color: '#006621' }}>picky-pic.com/blog/{form.title ? form.title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-') : 'post-slug'}</div>
              <div style={{ fontSize: 11, color: colors.textLight }}>{form.seoDescription || '메타 설명이 여기에 표시됩니다.'}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default BlogEditor;
