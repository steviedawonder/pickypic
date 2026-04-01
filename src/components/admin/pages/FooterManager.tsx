import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchSiteSettings, updateSiteSettings } from '../adminClient';

const footerFields = [
  { key: 'companyName', label: '회사명', placeholder: '주식회사 피키글로벌' },
  { key: 'businessNumber', label: '사업자등록번호', placeholder: '000-00-00000' },
  { key: 'address', label: '주소', placeholder: '서울시 ...' },
  { key: 'phone', label: '전화번호', placeholder: '02-000-0000' },
  { key: 'email', label: '이메일', placeholder: 'info@example.com' },
  { key: 'partnerEmail', label: '제휴/협업 이메일', placeholder: 'partner@example.com' },
  { key: 'kakaoChannel', label: '카카오 채널명', placeholder: '@채널명' },
  { key: 'kakaoUrl', label: '카카오 채널 URL', placeholder: 'https://pf.kakao.com/...' },
  { key: 'instagramOfficial', label: '인스타그램 공식', placeholder: 'pickypic.official' },
  { key: 'instagramGlobal', label: '인스타그램 글로벌', placeholder: 'picky.global' },
  { key: 'instagramSg', label: '인스타그램 싱가포르', placeholder: 'pickypic.sg' },
  { key: 'naverStoreUrl', label: '네이버 스토어 URL', placeholder: 'https://smartstore.naver.com/...' },
];

function FooterManager() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [settingsId, setSettingsId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchSiteSettings().then((data: any) => {
      if (data) {
        setSettingsId(data._id || '');
        const formData: Record<string, string> = {};
        footerFields.forEach(f => { formData[f.key] = data[f.key] || ''; });
        setForm(formData);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!settingsId) { alert('사이트 설정이 아직 생성되지 않았습니다. Sanity Studio에서 먼저 생성하세요.'); return; }
    setSaving(true);
    try {
      const data: Record<string, string | undefined> = {};
      footerFields.forEach(f => { data[f.key] = form[f.key] || undefined; });
      await updateSiteSettings(settingsId, data);
      alert('저장되었습니다.');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={s.header}><h1 style={s.title}>Footer 정보</h1></div>
        <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Footer 정보</h1>
        <button onClick={handleSave} disabled={saving} style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* Info banner */}
      <div style={{ ...s.card, background: '#eff6ff', border: `1px solid ${colors.blue}`, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
          사이트에 반영되려면 재빌드가 필요합니다 (1-2분 소요)
        </p>
      </div>

      <div style={s.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {footerFields.map(field => (
            <div key={field.key}>
              <label style={s.label}>{field.label}</label>
              <input
                style={s.input}
                value={form[field.key] || ''}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FooterManager;
