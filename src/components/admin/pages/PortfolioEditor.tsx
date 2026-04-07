import { useState, useEffect, useRef } from 'react';
import { colors, s } from '../shared/styles';
import {
  fetchPortfolioItem, createPortfolioItem, updatePortfolioItem,
  uploadImage, triggerRebuild,
} from '../adminClient';

const categoryOptions = [
  { value: 'modern-picky', label: 'Modern Picky (모던피키)', ko: '모던피키' },
  { value: 'classic-picky', label: 'Classic Picky (클래식피키)', ko: '클래식피키' },
  { value: 'urban-picky', label: 'Urban Picky (어반피키)', ko: '어반피키' },
  { value: 'modern-mini', label: 'Modern Mini Picky (모던미니피키)', ko: '모던미니피키' },
  { value: 'urban-mini', label: 'Urban Mini Picky (어반미니피키)', ko: '어반미니피키' },
  { value: 'modern-retro', label: 'Modern Retro Picky (모던레트로피키)', ko: '모던레트로피키' },
  { value: 'urban-retro', label: 'Urban Retro Picky (어반레트로피키)', ko: '어반레트로피키' },
  { value: 'outdoor', label: 'Outdoor Picky (아웃도어피키)', ko: '아웃도어피키' },
  { value: 'air', label: 'Air Picky (에어피키)', ko: '에어피키' },
];

interface PortfolioImage {
  _key: string;
  _type: 'image';
  asset: { _type: 'reference'; _ref: string; url?: string };
  alt?: string;
  caption?: string;
}

// Auto-generate SEO fields from title, category, client
function generateSeoFields(title: string, category: string, client: string) {
  const cat = categoryOptions.find(c => c.value === category);
  const catLabel = cat?.label?.split(' (')[0] || '';
  const catKo = cat?.ko || '';
  const clientName = client || title.split(' x ')[0]?.trim() || '';

  const focusKeyword = clientName
    ? `${clientName} 포토부스 렌탈`
    : `${catKo} 포토부스 렌탈`;

  const seoTitle = clientName
    ? `${clientName} x 피키픽 ${catLabel} 포토부스 렌탈`
    : `${title} | ${catLabel} 포토부스 렌탈`;

  const seoDescription = clientName
    ? `${clientName}과 피키픽이 함께한 ${catKo}(${catLabel}) 포토부스 렌탈 포트폴리오. 기업 행사, 브랜드 협업 포토부스 대여 전문.`
    : `${title} - ${catKo} 포토부스 렌탈 포트폴리오. 피키픽 포토부스 대여 및 기업 행사 렌탈 전문.`;

  return {
    focusKeyword: focusKeyword.substring(0, 50),
    seoTitle: seoTitle.substring(0, 60),
    seoDescription: seoDescription.substring(0, 155),
  };
}

function PortfolioEditor({ itemId, onNavigate }: { itemId?: string; onNavigate: (page: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | undefined>(itemId);
  const [toastMsg, setToastMsg] = useState('');
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [seoManuallyEdited, setSeoManuallyEdited] = useState(false);

  const [form, setForm] = useState({
    title: '', category: '', client: '', description: '',
    order: 0, isVisible: true,
    seoTitle: '', seoDescription: '', focusKeyword: '',
  });

  useEffect(() => {
    if (itemId) {
      fetchPortfolioItem(itemId).then((item: any) => {
        if (!item) return;
        setForm({
          title: item.title || '', category: item.category || '',
          client: item.client || '', description: item.description || '',
          order: item.order || 0, isVisible: item.isVisible !== false,
          seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '',
          focusKeyword: item.focusKeyword || '',
        });
        if (item.seoTitle || item.seoDescription || item.focusKeyword) {
          setSeoManuallyEdited(true);
        }
        if (item.images && Array.isArray(item.images)) {
          setImages(item.images.map((img: any, i: number) => ({
            _key: img._key || `img-${i}`,
            _type: 'image',
            asset: { _type: 'reference', _ref: img.asset?._id || '', url: img.asset?.url || '' },
            alt: img.alt || '',
            caption: img.caption || '',
          })));
        }
      });
    }
  }, [itemId]);

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  // Auto-generate SEO when title/category/client changes (unless manually edited)
  const autoGenerateSeo = (title: string, category: string, client: string) => {
    if (seoManuallyEdited) return;
    const seo = generateSeoFields(title, category, client);
    setForm(prev => ({ ...prev, ...seo }));
  };

  const [galleryStatus, setGalleryStatus] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setGalleryStatus(`${i + 1}/${files.length}`);
        const asset = await uploadImage(files[i], (status) => {
          setGalleryStatus(`${i + 1}/${files.length} - ${status}`);
        });
        setImages(prev => [...prev, {
          _key: `img-${Date.now()}-${i}`,
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id, url: asset.url },
          alt: '',
          caption: '',
        }]);
      }
      showToast(`${files.length}개 이미지 업로드 완료`);
    } catch (err: any) {
      alert('이미지 업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
      setGalleryStatus('');
      e.target.value = '';
    }
  };

  const updateImage = (index: number, field: 'alt' | 'caption', value: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, [field]: value } : img));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      moveImage(dragIndex, index);
      setDragIndex(index);
    }
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleSave = async (andRebuild: boolean) => {
    if (!form.title || !form.category) {
      alert('제목과 카테고리는 필수입니다.');
      return;
    }
    if (images.length === 0) {
      alert('이미지를 최소 1장 추가해주세요.');
      return;
    }
    setSaving(true);
    try {
      const slug = form.title.toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Auto-fill SEO if empty
      const seo = (form.seoTitle || form.seoDescription || form.focusKeyword)
        ? { seoTitle: form.seoTitle, seoDescription: form.seoDescription, focusKeyword: form.focusKeyword }
        : generateSeoFields(form.title, form.category, form.client);

      // First image = thumbnail
      const firstImage = images[0];

      const data: any = {
        title: form.title,
        slug: { _type: 'slug', current: slug },
        category: form.category,
        client: form.client,
        description: form.description,
        order: form.order,
        isVisible: form.isVisible,
        ...seo,
        thumbnail: {
          _type: 'image',
          asset: { _type: 'reference', _ref: firstImage.asset._ref },
          alt: firstImage.alt || `${form.title} 포토부스 렌탈`,
        },
        images: images.map(img => ({
          _key: img._key,
          _type: 'image',
          asset: { _type: 'reference', _ref: img.asset._ref },
          alt: img.alt || '',
          caption: img.caption || '',
        })),
      };

      if (currentItemId) {
        await updatePortfolioItem(currentItemId, data);
      } else {
        const created = await createPortfolioItem(data);
        if (created?._id) setCurrentItemId(created._id);
      }

      if (andRebuild) triggerRebuild();
      showToast(andRebuild ? '저장 및 사이트 반영 완료!' : '저장 완료!');
      if (andRebuild) setTimeout(() => onNavigate('portfolio'), 1000);
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const generateAutoSlug = () => {
    return form.title ? form.title.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') : '';
  };

  // First image preview for thumbnail indicator
  const firstImageUrl = images.length > 0 ? images[0].asset.url : '';

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toastMsg}
        </div>
      )}

      {/* Back */}
      <button onClick={() => onNavigate('portfolio')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: colors.textLight, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{'<'}</span> 포트폴리오 목록
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* ── Left Column ── */}
        <div>
          {/* Title */}
          <input
            value={form.title}
            onChange={e => {
              const val = e.target.value;
              updateField('title', val);
              autoGenerateSeo(val, form.category, form.client);
            }}
            placeholder="포트폴리오 제목 (예: Netflix Korea x PICKYPIC)"
            style={{ width: '100%', fontSize: 24, fontWeight: 800, border: `1px solid ${colors.border}`, borderRadius: 8, outline: 'none', padding: '14px 16px', marginBottom: 10, color: colors.text, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
          />

          {/* Slug preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, fontSize: 13, color: colors.textLight }}>
            <span style={{ fontWeight: 600 }}>/portfolio/</span>
            <input value={generateAutoSlug()} readOnly style={{ border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, color: colors.textLight, flex: 1, outline: 'none', background: '#fafafa' }} />
          </div>

          {/* Basic Info */}
          <div style={{ ...s.card }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>기본 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={s.label}>포토부스 모델 *</label>
                <select style={s.input} value={form.category} onChange={e => {
                  const val = e.target.value;
                  updateField('category', val);
                  autoGenerateSeo(form.title, val, form.client);
                }}>
                  <option value="">선택</option>
                  {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>클라이언트</label>
                <input style={s.input} value={form.client} onChange={e => {
                  const val = e.target.value;
                  updateField('client', val);
                  autoGenerateSeo(form.title, form.category, val);
                }} placeholder="브랜드명" />
              </div>
              <div>
                <label style={s.label}>설명</label>
                <input style={s.input} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="예: 설화수 x 피키픽" />
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div style={{ ...s.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>상세 이미지 ({images.length}개)</h3>
              <label style={{ ...s.btn, ...s.btnPrimary, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer', fontSize: 12 }}>
                {uploading ? (galleryStatus || '업로드 중...') : '+ 이미지 추가'}
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
            <p style={{ fontSize: 11, color: colors.textLight, marginBottom: 16 }}>
              첫 번째 이미지가 목록 썸네일로 자동 사용됩니다. 드래그로 순서를 변경할 수 있습니다.
            </p>

            {images.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', border: `2px dashed ${colors.border}`, borderRadius: 8, color: colors.textLight }}>
                <p style={{ fontSize: 14, marginBottom: 8 }}>이미지를 추가해주세요</p>
                <p style={{ fontSize: 12 }}>여러 장을 한번에 선택할 수 있습니다</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {images.map((img, i) => (
                  <div
                    key={img._key}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, padding: 12,
                      border: `1px solid ${i === 0 ? colors.primary : (dragIndex === i ? colors.primary : colors.border)}`,
                      borderRadius: 8, background: i === 0 ? '#fef9e7' : (dragIndex === i ? '#fef9e7' : '#fff'),
                      cursor: 'grab', alignItems: 'start',
                    }}
                  >
                    {/* Image preview */}
                    <div style={{ position: 'relative' }}>
                      {img.asset.url && (
                        <img src={img.asset.url} alt={img.alt || ''} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                      <span style={{ position: 'absolute', top: 4, left: 4, background: i === 0 ? colors.primary : 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                        {i === 0 ? '썸네일' : i + 1}
                      </span>
                    </div>

                    {/* Alt + Caption */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          Alt Text
                          <span style={{ fontSize: 9, fontWeight: 500, color: '#fff', background: colors.green, padding: '1px 5px', borderRadius: 3 }}>SEO</span>
                        </label>
                        <input
                          style={{ ...s.input, fontSize: 12, padding: '6px 10px' }}
                          value={img.alt || ''}
                          onChange={e => updateImage(i, 'alt', e.target.value)}
                          placeholder="예: 넷플릭스 팝업스토어 모던피키 포토부스 촬영 현장"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>캡션</label>
                        <input
                          style={{ ...s.input, fontSize: 12, padding: '6px 10px' }}
                          value={img.caption || ''}
                          onChange={e => updateImage(i, 'caption', e.target.value)}
                          placeholder="예: 브랜드 로고가 래핑된 모던피키 포토부스와 방문객들"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button onClick={() => moveImage(i, i - 1)} disabled={i === 0} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 8px', cursor: i === 0 ? 'default' : 'pointer', fontSize: 12, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                      <button onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 8px', cursor: i === images.length - 1 ? 'default' : 'pointer', fontSize: 12, opacity: i === images.length - 1 ? 0.3 : 1 }}>▼</button>
                      <button onClick={() => removeImage(i)} style={{ background: 'none', border: `1px solid ${colors.red}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12, color: colors.red }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Save Panel */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>저장</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isVisible} onChange={e => updateField('isVisible', e.target.checked)} />
                사이트에 표시
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>정렬 순서</label>
              <input type="number" style={s.input} value={form.order} onChange={e => updateField('order', parseInt(e.target.value) || 0)} />
              <span style={{ fontSize: 11, color: colors.textLight }}>숫자가 클수록 목록에서 위에 표시됩니다</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={{ ...s.btn, ...s.btnOutline, flex: 1, fontSize: 12 }}>
                {saving ? '...' : '임시저장'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} style={{ ...s.btn, ...s.btnPrimary, flex: 1, fontSize: 12 }}>
                {saving ? '...' : '저장 & 반영'}
              </button>
            </div>
          </div>

          {/* Thumbnail Preview (auto from first image) */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>썸네일 미리보기</h3>
            <p style={{ fontSize: 11, color: colors.textLight, marginBottom: 8 }}>첫 번째 이미지가 자동으로 썸네일로 사용됩니다</p>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', background: '#fafafa', textAlign: 'center', padding: firstImageUrl ? 0 : 24 }}>
              {firstImageUrl ? (
                <img src={firstImageUrl} alt="썸네일 미리보기" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ fontSize: 12, color: colors.textLight }}>이미지를 추가하면 여기에 표시됩니다</div>
              )}
            </div>
          </div>

          {/* SEO Settings (auto-generated) */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>SEO 설정</h3>
              {seoManuallyEdited ? (
                <button onClick={() => {
                  setSeoManuallyEdited(false);
                  const seo = generateSeoFields(form.title, form.category, form.client);
                  setForm(prev => ({ ...prev, ...seo }));
                }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: colors.blue }}>
                  자동 생성으로 되돌리기
                </button>
              ) : (
                <span style={{ fontSize: 10, color: colors.green, fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>자동 생성</span>
              )}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>포커스 키워드</label>
              <input style={s.input} value={form.focusKeyword} onChange={e => { updateField('focusKeyword', e.target.value); setSeoManuallyEdited(true); }} placeholder="자동 생성됨 — 제목/카테고리 입력 시" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>SEO 제목</label>
              <input style={s.input} value={form.seoTitle} onChange={e => { updateField('seoTitle', e.target.value); setSeoManuallyEdited(true); }} placeholder="자동 생성됨" />
              <span style={{ fontSize: 11, color: form.seoTitle.length > 60 ? colors.red : colors.textLight }}>{form.seoTitle.length}/60자</span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 4, display: 'block' }}>SEO 설명</label>
              <textarea style={{ ...s.textarea, minHeight: 60 }} value={form.seoDescription} onChange={e => { updateField('seoDescription', e.target.value); setSeoManuallyEdited(true); }} placeholder="자동 생성됨" />
              <span style={{ fontSize: 11, color: form.seoDescription.length > 160 ? colors.red : colors.textLight }}>{form.seoDescription.length}/160자</span>
            </div>
          </div>

          {/* Google Preview */}
          <div style={s.card}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>검색 미리보기</h3>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0dab' }}>
                {form.seoTitle || form.title || 'SEO 제목'} | 피키픽 포트폴리오
              </div>
              <div style={{ fontSize: 11, color: '#006621' }}>
                picky-pic.com/portfolio/{generateAutoSlug() || 'portfolio-slug'}
              </div>
              <div style={{ fontSize: 11, color: colors.textLight }}>
                {form.seoDescription || `${form.title} - 피키픽 포토부스 렌탈 포트폴리오.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioEditor;
