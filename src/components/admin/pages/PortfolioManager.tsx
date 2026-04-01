import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchPortfolioItems, createPortfolioItem, deletePortfolioItem, uploadImage } from '../adminClient';
import { portfolioItems as localPortfolioItems } from '../../../data/portfolio';

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
      try {
        await deletePortfolioItem(id);
        load();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
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

export default PortfolioManager;
