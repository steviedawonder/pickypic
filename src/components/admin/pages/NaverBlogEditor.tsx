import { useState, useEffect, useRef, useCallback } from 'react';
import { colors } from '../shared/styles';
import { calculateScores } from '../shared/seoScoring';
import { htmlToPortableText, portableTextToHtml } from '../shared/portableText';
import {
  fetchCategories, fetchBlogPost, fetchBlogTemplates,
  createBlogPost, updateBlogPost, createBlogTemplate, deleteBlogTemplate,
  uploadImage, triggerRebuild, fetchTags, createTag,
} from '../adminClient';
import NaverRichTextEditor from './NaverRichTextEditor';
import type { NaverEditorRef } from './NaverRichTextEditor';
import NaverEditorToolbar from './NaverEditorToolbar';
import NaverInsertBar from './NaverInsertBar';
import NaverPublishModal from './NaverPublishModal';
import NaverSeoSidebar from './NaverSeoSidebar';

interface Props {
  postId?: string;
  onNavigate: (page: string) => void;
}

export default function NaverBlogEditor({ postId, onNavigate }: Props) {
  const [form, setForm] = useState({
    title: '', excerpt: '', body: '', focusKeyword: '', seoTitle: '', seoDescription: '',
    categoryId: '', tags: [] as string[], tagInput: '', publishedAt: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(postId);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [mainImageRefId, setMainImageRefId] = useState('');
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [mainImageStatus, setMainImageStatus] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [seoSidebarOpen, setSeoSidebarOpen] = useState(true);
  const [autoSaveCount, setAutoSaveCount] = useState(0);
  const editorRef = useRef<NaverEditorRef>(null);

  /* ── Dirty tracking ── */
  const markDirty = useCallback(() => setIsDirty(true), []);

  /* ── beforeunload warning ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ── Data fetching ── */
  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchBlogTemplates().then(setTemplates).catch(() => {});
    fetchTags().then((tags: any[]) => {
      // Deduplicate by title
      const seen = new Set<string>();
      const unique = tags.filter((t: any) => {
        const label = t.title || t.name || '';
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      });
      setAllTags(unique);
    }).catch(() => {});
    if (postId) {
      fetchBlogPost(postId).then((post: any) => {
        if (post) {
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
          if (post.mainImage?.asset?.url) setMainImageUrl(post.mainImage.asset.url);
          if (post.mainImage?.asset?._id) setMainImageRefId(post.mainImage.asset._id);
        }
      });
    }
  }, [postId]);

  /* ── Field helpers ── */
  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    markDirty();
  };

  const addTag = async () => {
    const tagName = form.tagInput.trim();
    if (!tagName || form.tags.includes(tagName)) return;
    const exists = allTags.some((t: any) => t.title === tagName);
    if (!exists) {
      try {
        const newTag = await createTag(tagName);
        setAllTags(prev => [...prev, newTag]);
      } catch (err: any) {
        // ignore if tag creation fails
      }
    }
    setForm(prev => ({ ...prev, tags: [...prev.tags, tagName], tagInput: '' }));
    markDirty();
  };

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    markDirty();
  };

  /* ── Toast ── */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  /* ── Save / Publish ── */
  const handleSave = async (publish: boolean) => {
    setSaving(true);
    setErrorMsg('');
    try {
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
      if (mainImageRefId) {
        data.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: mainImageRefId } };
      }
      if (currentPostId) {
        await updateBlogPost(currentPostId, data);
      } else {
        data.slug = { _type: 'slug', current: generateSlug(form.title) };
        const created = await createBlogPost(data);
        if (created?._id) setCurrentPostId(created._id);
      }
      triggerRebuild();
      setIsDirty(false);

      if (publish) {
        // Fire and forget indexing
        const postUrl = `https://picky-pic.com/blog/${generateSlug(form.title)}`;
        fetch('/api/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: postUrl }) }).catch(() => {});
        fetch('/api/naver-indexing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: postUrl }) }).catch(() => {});

        showToast('발행되었습니다!');
        setTimeout(() => onNavigate('blogs'), 1000);
      } else {
        setAutoSaveCount(prev => prev + 1);
        showToast('임시저장 완료!');
      }
    } catch (e: any) {
      setErrorMsg('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Main image upload ── */
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageUploading(true);
    try {
      const asset = await uploadImage(file, setMainImageStatus);
      setMainImageUrl(asset.url);
      setMainImageRefId(asset._id);
      markDirty();
    } catch (err: any) {
      alert('이미지 업로드 실패: ' + err.message);
    } finally {
      setMainImageUploading(false);
      setMainImageStatus('');
    }
  };

  /* ── Navigation ── */
  const handleNavigateBack = () => {
    if (isDirty) {
      if (!window.confirm('작성 중인 글이 있습니다. 나가시겠습니까?')) return;
    }
    onNavigate('blogs');
  };

  /* ── Slug (shared) ── */
  const generateSlug = (title: string) => title ? title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') : '';
  const slug = generateSlug(form.title);

  /* ── SEO Scores ── */
  const scores = calculateScores({
    title: form.title, excerpt: form.excerpt, body: form.body,
    focusKeyword: form.focusKeyword, seoTitle: form.seoTitle,
    seoDesc: form.seoDescription, tags: form.tags, category: form.categoryId,
    slug,
  });

  /* ── Template functions ── */
  const handleSaveTemplate = async () => {
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
  };

  const handleApplyTemplate = (t: any) => {
    let bodyHtml = '';
    if (t.body && Array.isArray(t.body)) bodyHtml = portableTextToHtml(t.body);
    else if (typeof t.body === 'string') bodyHtml = t.body;
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
    markDirty();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    await deleteBlogTemplate(id);
    fetchBlogTemplates().then(setTemplates).catch(() => {});
    showToast('템플릿 삭제됨');
  };

  /* ── InsertBar callbacks ── */
  const handleImageUploadTrigger = () => {
    (window as any).__naverEditorImageInput?.click();
  };

  const handleVideoInsert = () => {
    (window as any).__naverEditorShowYoutube?.();
  };

  const handleQuoteInsert = () => {
    editorRef.current?.handleHeading('blockquote');
  };

  const handleDividerInsert = () => {
    editorRef.current?.insertHTML('<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;" />');
  };

  const handleLinkInsert = () => {
    const url = prompt('링크 URL을 입력하세요:', 'https://');
    if (url) editorRef.current?.exec('createLink', url);
  };

  const handleCodeInsert = () => {
    editorRef.current?.insertHTML('<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace;overflow-x:auto;margin:12px 0;"><code>\n</code></pre>');
  };

  const handleTableInsert = () => {
    editorRef.current?.insertHTML(
      '<table style="width:100%;border-collapse:collapse;margin:12px 0;">' +
      '<tr><td style="border:1px solid #ddd;padding:8px;min-width:60px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;min-width:60px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;min-width:60px;">&nbsp;</td></tr>' +
      '<tr><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td></tr>' +
      '<tr><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td><td style="border:1px solid #ddd;padding:8px;">&nbsp;</td></tr>' +
      '</table>'
    );
  };

  const handleFileUploadTrigger = () => {
    (window as any).__naverEditorFileInput?.click();
  };

  const handleVideoUploadTrigger = () => {
    (window as any).__naverEditorVideoInput?.click();
  };

  const handleStickerInsert = () => {
    showToast('스티커 기능은 준비 중입니다.');
  };

  const handleScheduleInsert = () => {
    const today = new Date().toLocaleDateString('ko-KR');
    editorRef.current?.insertHTML(
      `<div contenteditable="false" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;margin:8px 0;font-size:13px;color:#1e40af;">\u{1F4C5} ${today}</div>`
    );
  };

  const handleMathInsert = () => {
    const formula = prompt('수식을 입력하세요:', 'x\u00B2 + y\u00B2 = z\u00B2');
    if (formula) {
      editorRef.current?.insertHTML(
        `<span style="font-family:'Cambria Math',serif;font-style:italic;font-size:16px;padding:2px 4px;background:#f9fafb;border-radius:4px;">${formula}</span>`
      );
    }
  };

  const handlePlaceInsert = () => {
    const address = prompt('주소를 입력하세요:');
    if (address) {
      editorRef.current?.insertHTML(
        `<div contenteditable="false" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:8px 0;font-size:13px;color:#166534;">\u{1F4CD} ${address}</div>`
      );
    }
  };

  /* ── Render ── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: '#f7f8fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toastMsg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 52, background: '#fff', borderBottom: '1px solid #e5e8eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleNavigateBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#333', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#03c75a' }}>P blog</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => handleSave(false)} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#333', padding: '8px 12px' }}>
            저장 <span style={{ color: '#999', fontSize: 12 }}>{autoSaveCount}</span>
          </button>
          <button onClick={() => setShowPublishModal(true)} style={{ background: '#03c75a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            발행
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Insert Bar */}
          <NaverInsertBar
            onImageUpload={handleImageUploadTrigger}
            onVideoInsert={handleVideoInsert}
            onVideoUpload={handleVideoUploadTrigger}
            onStickerInsert={handleStickerInsert}
            onQuoteInsert={handleQuoteInsert}
            onDividerInsert={handleDividerInsert}
            onLinkInsert={handleLinkInsert}
            onFileUpload={handleFileUploadTrigger}
            onScheduleInsert={handleScheduleInsert}
            onCodeInsert={handleCodeInsert}
            onTableInsert={handleTableInsert}
            onMathInsert={handleMathInsert}
            onPlaceInsert={handlePlaceInsert}
          />

          {/* Formatting Toolbar */}
          <NaverEditorToolbar editorRef={editorRef} />

          {/* Editor Content (centered, max-width 860px) */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', background: '#f7f8fa' }}>
            <div style={{ width: '100%', maxWidth: 860, background: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100%', overflow: 'hidden' }}>
              {/* Title Input */}
              <input
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="제목"
                style={{ width: '100%', fontSize: 30, fontWeight: 400, border: 'none', outline: 'none', padding: '32px 48px 0', color: '#1a1a1a', fontFamily: '"Nanum Gothic", sans-serif', boxSizing: 'border-box', background: 'transparent' }}
              />
              {/* Title divider */}
              <div style={{ margin: '16px 48px', borderBottom: '1px solid #e5e8eb' }} />

              {/* Rich Text Editor */}
              <NaverRichTextEditor
                ref={editorRef}
                value={form.body}
                onChange={(html) => updateField('body', html)}
                onImageSelect={() => {}}
              />
            </div>
          </div>
        </div>

        {/* SEO Sidebar */}
        <NaverSeoSidebar
          open={seoSidebarOpen}
          onToggle={() => setSeoSidebarOpen(!seoSidebarOpen)}
          form={form}
          updateField={updateField}
          slug={slug}
          onInsertH2={() => { editorRef.current?.handleHeading('h2'); }}
          onInsertImage={handleImageUploadTrigger}
          onInsertLink={handleLinkInsert}
          onInsertList={() => { editorRef.current?.exec('insertUnorderedList'); }}
        />
      </div>

      {/* Publish Modal */}
      <NaverPublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onSave={handleSave}
        saving={saving}
        form={form}
        updateField={updateField}
        categories={categories}
        allTags={allTags}
        templates={templates}
        mainImageUrl={mainImageUrl}
        mainImageUploading={mainImageUploading}
        onMainImageUpload={handleMainImageUpload}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onApplyTemplate={handleApplyTemplate}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        scores={scores}
        slug={slug}
      />

      {/* Error display */}
      {errorMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#dc2626', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
