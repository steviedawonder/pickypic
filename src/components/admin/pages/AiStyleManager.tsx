import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchAiStyles, createAiStyle, updateAiStyle, deleteAiStyle, uploadImage as uploadImageAsset, triggerRebuild } from '../adminClient';
import { aiStyleCategories } from '../../../data/aiStyles';

const emptyForm = {
  nameKo: '', nameEn: '', nameJp: '',
  descKo: '', descEn: '', descJp: '',
  category: aiStyleCategories[0].id, people: 'solo', order: 0, isNew: false, isActive: true,
};

const categoryLabel = (id: string) => aiStyleCategories.find(c => c.id === id)?.label.ko || id;
const imageRef = (assetId: string) => ({ _type: 'image', asset: { _type: 'reference', _ref: assetId } });

function AiStyleManager() {
  const [styles, setStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [imageAssetId, setImageAssetId] = useState('');
  const [beforePreview, setBeforePreview] = useState('');
  const [beforeAssetId, setBeforeAssetId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchAiStyles().then(setStyles).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setImagePreview('');
    setImageAssetId('');
    setBeforePreview('');
    setBeforeAssetId('');
    setEditing(null);
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      nameKo: item.nameKo || '', nameEn: item.nameEn || '', nameJp: item.nameJp || '',
      descKo: item.descKo || '', descEn: item.descEn || '', descJp: item.descJp || '',
      category: item.category || aiStyleCategories[0].id,
      people: item.people || 'solo',
      order: item.order || 0,
      isNew: !!item.isNew,
      isActive: item.isActive ?? true,
    });
    setImagePreview(item.image?.asset?.url || '');
    setImageAssetId(item.image?.asset?._id || '');
    setBeforePreview(item.beforeImage?.asset?.url || '');
    setBeforeAssetId(item.beforeImage?.asset?._id || '');
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'before') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageAsset(file);
      if (type === 'image') {
        setImagePreview(asset.url || '');
        setImageAssetId(asset._id);
      } else {
        setBeforePreview(asset.url || '');
        setBeforeAssetId(asset._id);
      }
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.nameKo.trim()) { alert('한국어 이름을 입력하세요.'); return; }
    if (!imageAssetId) { alert('결과 이미지를 업로드하세요.'); return; }

    const data: any = {
      ...form,
      order: Number(form.order) || 0,
      image: imageRef(imageAssetId),
      // null clears a removed original on update; create ignores it
      beforeImage: beforeAssetId ? imageRef(beforeAssetId) : null,
    };

    try {
      const wasEditing = !!editing;
      if (editing) {
        await updateAiStyle(editing._id, data);
      } else {
        if (!data.beforeImage) delete data.beforeImage;
        await createAiStyle(data);
      }
      resetForm();
      load();
      alert(wasEditing ? '스타일이 수정되었습니다. 사이트 재빌드 시작 (1-2분)' : '스타일이 추가되었습니다. 사이트 재빌드 시작 (1-2분)');
      triggerRebuild();
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 스타일을 삭제하시겠습니까?`)) return;
    try {
      await deleteAiStyle(id);
      load();
      triggerRebuild();
    } catch (e) {
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateAiStyle(id, { isActive: !current });
      load();
      triggerRebuild();
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const shown = filter ? styles.filter(item => item.category === filter) : styles;
  const textField = (key: keyof typeof emptyForm, label: string, placeholder = '') => (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.input} value={form[key] as string} placeholder={placeholder}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>AI 스타일 갤러리</h1>
        <button onClick={openNew} style={{ ...s.btn, ...s.btnPrimary }}>+ 스타일 추가</button>
      </div>
      <p style={{ fontSize: 12, color: colors.textLight, margin: '-8px 0 16px' }}>
        /ai-photobooth/gallery 에 보입니다. 하나도 등록되지 않은 동안에는 AI 포토부스 페이지의 기본 견본 12종이 보입니다.
        샘플 인물은 AI 가상 인물이나 초상권 동의를 받은 사람만 써 주세요.
      </p>

      {showForm && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>{editing ? '스타일 수정' : '새 스타일 추가'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {textField('nameKo', '이름 (한국어) *', '예: 전투기 조종사')}
            {textField('nameEn', '이름 (영어)', '비우면 한국어로 보임')}
            {textField('nameJp', '이름 (일본어)', '비우면 한국어로 보임')}
            {textField('descKo', '한 줄 설명 (한국어)', '예: 에어쇼·항공 행사')}
            {textField('descEn', '한 줄 설명 (영어)')}
            {textField('descJp', '한 줄 설명 (일본어)')}
            <div>
              <label style={s.label}>카테고리 *</label>
              <select style={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {aiStyleCategories.map(c => <option key={c.id} value={c.id}>{c.label.ko}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>인원</label>
              <select style={s.input} value={form.people} onChange={e => setForm(p => ({ ...p, people: e.target.value }))}>
                <option value="solo">1인</option>
                <option value="duo">2인</option>
                <option value="group">단체</option>
              </select>
            </div>
            <div>
              <label style={s.label}>정렬 순서</label>
              <input type="number" style={s.input} value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={s.label}>결과 이미지 * (세로 2:3 권장)</label>
              {imagePreview && <img src={imagePreview} alt="결과 미리보기" style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }} />}
              <label style={{ ...s.btn, ...s.btnOutline, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? '업로드 중...' : imagePreview ? '이미지 변경' : '이미지 선택'}
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image')} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
            <div>
              <label style={s.label}>원본 이미지 (선택)</label>
              {beforePreview && <img src={beforePreview} alt="원본 미리보기" style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }} />}
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ ...s.btn, ...s.btnOutline, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
                  {uploading ? '업로드 중...' : beforePreview ? '이미지 변경' : '이미지 선택'}
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'before')} style={{ display: 'none' }} disabled={uploading} />
                </label>
                {beforePreview && (
                  <button onClick={() => { setBeforePreview(''); setBeforeAssetId(''); }} style={{ ...s.btn, ...s.btnOutline }}>원본 빼기</button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                노출
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isNew} onChange={e => setForm(p => ({ ...p, isNew: e.target.checked }))} />
                NEW 표시
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetForm} style={{ ...s.btn, ...s.btnOutline }}>취소</button>
              <button onClick={handleSave} disabled={uploading} style={{ ...s.btn, ...s.btnPrimary }}>{editing ? '수정' : '추가'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={s.card}>
          <div style={{ marginBottom: 12 }}>
            <select style={{ ...s.input, width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">전체 카테고리 ({styles.length})</option>
              {aiStyleCategories.map(c => {
                const n = styles.filter(item => item.category === c.id).length;
                return <option key={c.id} value={c.id}>{c.label.ko} ({n})</option>;
              })}
            </select>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>이미지</th>
                <th style={s.th}>이름</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>노출</th>
                <th style={s.th}>순서</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item: any) => (
                <tr key={item._id}>
                  <td style={s.td}>
                    {item.image?.asset?.url ? (
                      <img src={`${item.image.asset.url}?w=96&fm=webp`} alt={item.nameKo || ''} style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4 }} />
                    ) : <span style={{ color: colors.textLight, fontSize: 11 }}>-</span>}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600 }}>
                    {item.nameKo}{item.isNew && <span style={{ ...s.badge, marginLeft: 6, background: '#ecfccb', color: '#3f6212' }}>NEW</span>}
                    <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 400 }}>{[item.nameEn, item.nameJp].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{categoryLabel(item.category)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: item.isActive !== false ? '#dcfce7' : '#fee2e2', color: item.isActive !== false ? colors.green : colors.red, cursor: 'pointer' }}
                      onClick={() => toggleActive(item._id, item.isActive !== false)}>
                      {item.isActive !== false ? '노출' : '숨김'}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{item.order ?? 0}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(item)} style={{ fontSize: 11, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete(item._id, item.nameKo)} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 스타일이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AiStyleManager;
