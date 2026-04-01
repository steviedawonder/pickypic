import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchPopupBanners, createPopupBanner, updatePopupBanner, deletePopupBanner, uploadImage as uploadImageAsset } from '../adminClient';

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

export default PopupManager;
