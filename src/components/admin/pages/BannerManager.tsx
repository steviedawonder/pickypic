import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchBanners, createBanner, updateBanner, deleteBanner, uploadImage as uploadImageAsset } from '../adminClient';

function BannerManager() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', linkUrl: '', altText: '', order: 0,
    startDate: '', endDate: '', isActive: true,
  });
  const [desktopPreview, setDesktopPreview] = useState('');
  const [mobilePreview, setMobilePreview] = useState('');
  const [desktopAssetId, setDesktopAssetId] = useState('');
  const [mobileAssetId, setMobileAssetId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchBanners().then(setBanners).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: '', linkUrl: '', altText: '', order: 0, startDate: '', endDate: '', isActive: true });
    setDesktopPreview('');
    setMobilePreview('');
    setDesktopAssetId('');
    setMobileAssetId('');
    setEditing(null);
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (banner: any) => {
    setEditing(banner);
    setForm({
      title: banner.title || '',
      linkUrl: banner.linkUrl || '',
      altText: banner.altText || '',
      order: banner.order || 0,
      startDate: banner.startDate ? banner.startDate.slice(0, 16) : '',
      endDate: banner.endDate ? banner.endDate.slice(0, 16) : '',
      isActive: banner.isActive ?? true,
    });
    setDesktopPreview(banner.desktopImage?.asset?.url || '');
    setMobilePreview(banner.mobileImage?.asset?.url || '');
    setDesktopAssetId(banner.desktopImage?.asset?._id || '');
    setMobileAssetId(banner.mobileImage?.asset?._id || '');
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageAsset(file);
      if (type === 'desktop') {
        setDesktopPreview(asset.url || '');
        setDesktopAssetId(asset._id);
      } else {
        setMobilePreview(asset.url || '');
        setMobileAssetId(asset._id);
      }
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title) { alert('배너 제목을 입력하세요.'); return; }
    if (!desktopAssetId) { alert('PC 배너 이미지를 업로드하세요.'); return; }

    const data: any = {
      title: form.title,
      linkUrl: form.linkUrl || undefined,
      altText: form.altText || undefined,
      order: Number(form.order) || 0,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      isActive: form.isActive,
      desktopImage: { _type: 'image', asset: { _type: 'reference', _ref: desktopAssetId } },
    };
    if (mobileAssetId) {
      data.mobileImage = { _type: 'image', asset: { _type: 'reference', _ref: mobileAssetId } };
    }

    try {
      const wasEditing = !!editing;
      if (editing) {
        await updateBanner(editing._id, data);
      } else {
        await createBanner(data);
      }
      resetForm();
      load();
      alert(wasEditing ? '배너가 수정되었습니다.' : '배너가 추가되었습니다.');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 배너를 삭제하시겠습니까?`)) {
      try {
        await deleteBanner(id);
        load();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateBanner(id, { isActive: !current });
      load();
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>배너 관리</h1>
        <button onClick={openNew} style={{ ...s.btn, ...s.btnPrimary }}>+ 배너 추가</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>{editing ? '배너 수정' : '새 배너 추가'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={s.label}>배너 제목 *</label>
              <input style={s.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="관리용 배너 제목" />
            </div>
            <div>
              <label style={s.label}>링크 URL</label>
              <input style={s.input} value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label style={s.label}>대체 텍스트</label>
              <input style={s.input} value={form.altText} onChange={e => setForm(p => ({ ...p, altText: e.target.value }))} placeholder="이미지 설명 (접근성)" />
            </div>
            <div>
              <label style={s.label}>표시 순서</label>
              <input type="number" style={s.input} value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={s.label}>노출 시작일</label>
              <input type="datetime-local" style={s.input} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>노출 종료일</label>
              <input type="datetime-local" style={s.input} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {/* Image Uploads */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={s.label}>PC 배너 이미지 *</label>
              {desktopPreview && <img src={desktopPreview} alt="PC 미리보기" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
              <label style={{ ...s.btn, ...s.btnOutline, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? '업로드 중...' : desktopPreview ? '이미지 변경' : '이미지 선택'}
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'desktop')} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
            <div>
              <label style={s.label}>모바일 배너 이미지</label>
              {mobilePreview && <img src={mobilePreview} alt="모바일 미리보기" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
              <label style={{ ...s.btn, ...s.btnOutline, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? '업로드 중...' : mobilePreview ? '이미지 변경' : '이미지 선택'}
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'mobile')} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Active Toggle + Save */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
              활성화
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetForm} style={{ ...s.btn, ...s.btnOutline }}>취소</button>
              <button onClick={handleSave} style={{ ...s.btn, ...s.btnPrimary }}>{editing ? '수정' : '추가'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>썸네일</th>
                <th style={s.th}>제목</th>
                <th style={s.th}>활성</th>
                <th style={s.th}>순서</th>
                <th style={s.th}>기간</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner: any) => (
                <tr key={banner._id}>
                  <td style={s.td}>
                    {banner.desktopImage?.asset?.url ? (
                      <img src={banner.desktopImage.asset.url} alt={banner.altText || ''} style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                    ) : <span style={{ color: colors.textLight, fontSize: 11 }}>-</span>}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{banner.title}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: banner.isActive ? '#dcfce7' : '#fee2e2', color: banner.isActive ? colors.green : colors.red, cursor: 'pointer' }}
                      onClick={() => toggleActive(banner._id, banner.isActive)}>
                      {banner.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{banner.order ?? 0}</td>
                  <td style={{ ...s.td, fontSize: 11, color: colors.textLight }}>
                    {banner.startDate ? new Date(banner.startDate).toLocaleDateString('ko') : ''}
                    {banner.startDate && banner.endDate ? ' ~ ' : ''}
                    {banner.endDate ? new Date(banner.endDate).toLocaleDateString('ko') : ''}
                    {!banner.startDate && !banner.endDate ? '상시' : ''}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(banner)} style={{ fontSize: 11, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete(banner._id, banner.title)} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 배너가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BannerManager;
