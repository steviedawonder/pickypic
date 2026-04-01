import { useState, useEffect } from 'react';
import { colors, s } from '../shared/styles';
import { fetchSiteSettings, updateSiteSettings, changeAdminPassword } from '../adminClient';
import { useToast } from '../shared/Toast';

const tabs = [
  { id: 'basic', label: '기본 설정' },
  { id: 'code', label: '코드 삽입' },
  { id: 'services', label: '외부 서비스' },
  { id: 'email', label: '이메일 설정' },
  { id: 'security', label: '보안 설정' },
  { id: 'maintenance', label: '점검 모드' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const helperStyle: React.CSSProperties = { fontSize: 11, color: colors.textLight, marginTop: 4, lineHeight: 1.4 };
const fieldGroup: React.CSSProperties = { marginBottom: 20 };
const monoTextarea: React.CSSProperties = { ...s.textarea, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace', fontSize: 13 };

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await fetchSiteSettings();
      setSettings(data || {});
    } catch (e: any) {
      showToast(e.message || '설정을 불러올 수 없습니다', 'error');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveFields(fields: string[]) {
    if (!settings?._id) {
      showToast('설정 문서가 없습니다', 'error');
      return;
    }
    try {
      setSaving(true);
      const data: any = {};
      for (const f of fields) {
        data[f] = settings[f] ?? '';
      }
      await updateSiteSettings(settings._id, data);
      showToast('저장되었습니다', 'success');
    } catch (e: any) {
      showToast(e.message || '저장에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !currentPassword) {
      showToast('현재 비밀번호와 새 비밀번호를 입력하세요', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('비밀번호는 6자 이상이어야 합니다', 'warning');
      return;
    }
    try {
      setSaving(true);
      const result = await changeAdminPassword(currentPassword, newPassword);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('비밀번호가 변경되었습니다', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (e: any) {
      showToast(e.message || '비밀번호 변경에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: colors.textLight }}>설정을 불러오는 중...</div>;
  }

  function renderInput(field: string, label: string, helper: string, opts?: { type?: string; placeholder?: string }) {
    return (
      <div style={fieldGroup}>
        <label style={s.label}>{label}</label>
        <input
          style={s.input}
          type={opts?.type || 'text'}
          value={settings?.[field] || ''}
          onChange={e => updateField(field, opts?.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={opts?.placeholder}
        />
        <div style={helperStyle}>{helper}</div>
      </div>
    );
  }

  function renderTextarea(field: string, label: string, helper: string, mono?: boolean) {
    return (
      <div style={fieldGroup}>
        <label style={s.label}>{label}</label>
        <textarea
          style={mono ? monoTextarea : s.textarea}
          value={settings?.[field] || ''}
          onChange={e => updateField(field, e.target.value)}
        />
        <div style={helperStyle}>{helper}</div>
      </div>
    );
  }

  function renderSaveButton(fields: string[]) {
    return (
      <div style={{ marginTop: 24 }}>
        <button
          style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}
          disabled={saving}
          onClick={() => saveFields(fields)}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    );
  }

  function renderBasicTab() {
    return (
      <div>
        {renderInput('defaultSeoTitle', 'SEO 기본 타이틀', '검색엔진에 표시되는 사이트 기본 제목')}
        {renderTextarea('defaultSeoDescription', 'SEO 기본 설명', '검색엔진에 표시되는 사이트 기본 설명 (160자 이내 권장)')}
        {renderInput('analyticsUrl', '애널리틱스 URL', 'Google Analytics 대시보드 URL')}
        {renderSaveButton(['defaultSeoTitle', 'defaultSeoDescription', 'analyticsUrl'])}

        <div style={{ borderTop: `1px solid ${colors.border}`, margin: '32px 0 24px' }} />
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>비밀번호 변경</h3>
        <div style={fieldGroup}>
          <label style={s.label}>현재 비밀번호</label>
          <input style={s.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div style={fieldGroup}>
          <label style={s.label}>새 비밀번호</label>
          <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <div style={helperStyle}>6자 이상 입력하세요</div>
        </div>
        <div style={fieldGroup}>
          <label style={s.label}>새 비밀번호 확인</label>
          <input style={s.input} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        <div style={{ marginTop: 24 }}>
          <button style={{ ...s.btn, ...s.btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleChangePassword}>
            {saving ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    );
  }

  function renderCodeTab() {
    return (
      <div>
        <div style={{
          background: '#fffbeb', border: `1px solid ${colors.orange}`, borderRadius: 8,
          padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.6,
        }}>
          <strong>주의:</strong> 코드 삽입 설정을 변경하면 사이트 재빌드가 필요할 수 있습니다. 잘못된 코드 삽입은 사이트를 손상시킬 수 있으니 신중하게 수정하세요.
        </div>
        {renderTextarea('headScripts', 'Head Scripts', '<head> 태그 안에 삽입되는 스크립트 (GTM, 애널리틱스 등)', true)}
        {renderTextarea('headMeta', 'Head Meta Tags', '<head> 태그 안에 삽입되는 메타 태그', true)}
        {renderTextarea('headCustomCss', 'Custom CSS', '<head> 태그 안에 삽입되는 커스텀 CSS', true)}
        {renderTextarea('bodyStartScripts', 'Body Start Scripts', '<body> 태그 바로 뒤에 삽입되는 스크립트 (GTM noscript 등)', true)}
        {renderTextarea('bodyEndScripts', 'Body End Scripts', '</body> 태그 바로 앞에 삽입되는 스크립트 (채팅 플러그인 등)', true)}
        {renderSaveButton(['headScripts', 'headMeta', 'headCustomCss', 'bodyStartScripts', 'bodyEndScripts'])}
      </div>
    );
  }

  function renderServicesTab() {
    return (
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>애널리틱스</h3>
        {renderInput('gtmContainerId', 'GTM Container ID', 'Google Tag Manager 컨테이너 ID (예: GTM-XXXXXX)', { placeholder: 'GTM-XXXXXX' })}
        {renderInput('ga4MeasurementId', 'GA4 Measurement ID', 'Google Analytics 4 측정 ID (예: G-XXXXXXXXXX)', { placeholder: 'G-XXXXXXXXXX' })}
        <div style={{
          background: '#fffbeb', border: `1px solid ${colors.orange}`, borderRadius: 8,
          padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#92400e', lineHeight: 1.6,
        }}>
          GTM과 GA4를 동시에 사용하면 이중 집계될 수 있습니다. GTM 내에서 GA4를 설정한 경우 여기서 GA4 ID를 비워두세요.
        </div>
        {renderInput('naverAnalyticsId', 'Naver Analytics ID', '네이버 애널리틱스 사이트 ID')}
        {renderInput('kakaoPixelId', 'Kakao Pixel ID', '카카오 픽셀 추적 ID')}
        {renderInput('metaPixelId', 'Meta Pixel ID', 'Meta (Facebook) 픽셀 ID')}

        <div style={{ borderTop: `1px solid ${colors.border}`, margin: '24px 0' }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>사이트 인증</h3>
        {renderInput('googleSiteVerification', 'Google Site Verification', 'Google Search Console 인증 메타 태그 content 값')}
        {renderInput('naverSiteVerification', 'Naver Site Verification', '네이버 서치어드바이저 인증 메타 태그 content 값')}
        {renderInput('naverSyndicationKey', 'Naver Syndication Key', '네이버 신디케이션 키')}

        <div style={{ borderTop: `1px solid ${colors.border}`, margin: '24px 0' }} />
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>보안 / 기타</h3>
        {renderInput('recaptchaSiteKey', 'reCAPTCHA Site Key', 'Google reCAPTCHA v3 사이트 키 (공개)')}
        {renderInput('recaptchaSecretKey', 'reCAPTCHA Secret Key', 'Google reCAPTCHA v3 비밀 키 (서버에서만 사용)', { type: 'password' })}
        {renderTextarea('chatPluginCode', '채팅 플러그인 코드', '카카오톡 채널 채팅, 채널톡 등 실시간 채팅 플러그인 삽입 코드', true)}
        {renderSaveButton([
          'gtmContainerId', 'ga4MeasurementId', 'naverAnalyticsId', 'kakaoPixelId', 'metaPixelId',
          'googleSiteVerification', 'naverSiteVerification', 'naverSyndicationKey',
          'recaptchaSiteKey', 'recaptchaSecretKey', 'chatPluginCode',
        ])}
      </div>
    );
  }

  function renderEmailTab() {
    return (
      <div>
        {renderInput('adminEmail', '관리자 이메일', '관리자 알림을 받을 이메일 주소')}
        {renderInput('adminEmailName', '관리자 이메일 발신자명', '이메일 발신 시 표시되는 이름')}
        {renderInput('rentalNotifyEmail', '렌탈 문의 알림 이메일', '렌탈 문의가 접수되면 알림을 받을 이메일')}
        {renderInput('collabNotifyEmail', '협업 문의 알림 이메일', '협업 문의가 접수되면 알림을 받을 이메일')}
        {renderInput('slackWebhookUrl', 'Slack Webhook URL', '알림을 받을 Slack Incoming Webhook URL', { placeholder: 'https://hooks.slack.com/services/...' })}
        {renderSaveButton(['adminEmail', 'adminEmailName', 'rentalNotifyEmail', 'collabNotifyEmail', 'slackWebhookUrl'])}
      </div>
    );
  }

  function renderSecurityTab() {
    return (
      <div>
        <div style={fieldGroup}>
          <label style={s.label}>허용 IP 목록</label>
          <textarea
            style={monoTextarea}
            value={settings?.allowedIps || ''}
            onChange={e => updateField('allowedIps', e.target.value)}
            placeholder="192.168.1.1&#10;10.0.0.0/24"
          />
          <div style={helperStyle}>관리자 접근을 허용할 IP 주소 (줄바꿈으로 구분). 비어있으면 모든 IP 허용</div>
        </div>
        <div style={fieldGroup}>
          <label style={s.label}>차단 IP 목록</label>
          <textarea
            style={monoTextarea}
            value={settings?.blockedIps || ''}
            onChange={e => updateField('blockedIps', e.target.value)}
            placeholder="1.2.3.4&#10;5.6.7.8"
          />
          <div style={helperStyle}>차단할 IP 주소 (줄바꿈으로 구분)</div>
        </div>
        {renderInput('maxLoginAttempts', '최대 로그인 시도 횟수', '이 횟수를 초과하면 일시적으로 로그인이 차단됩니다 (기본: 5)', { type: 'number', placeholder: '5' })}
        {renderSaveButton(['allowedIps', 'blockedIps', 'maxLoginAttempts'])}
      </div>
    );
  }

  function renderMaintenanceTab() {
    return (
      <div>
        <div style={fieldGroup}>
          <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={settings?.isMaintenanceMode || false}
              onChange={e => updateField('isMaintenanceMode', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: colors.primary }}
            />
            점검 모드 활성화
          </label>
          {settings?.isMaintenanceMode && (
            <div style={{
              background: '#fef2f2', border: `1px solid ${colors.red}`, borderRadius: 8,
              padding: '12px 16px', marginTop: 12, fontSize: 13, color: '#991b1b', lineHeight: 1.6,
            }}>
              <strong>경고:</strong> 점검 모드가 활성화되면 허용된 IP를 제외한 모든 방문자에게 점검 페이지가 표시됩니다.
            </div>
          )}
        </div>
        {renderTextarea('maintenanceMessage', '점검 메시지', '방문자에게 표시될 점검 안내 메시지')}
        <div style={fieldGroup}>
          <label style={s.label}>점검 모드 허용 IP</label>
          <textarea
            style={monoTextarea}
            value={settings?.maintenanceAllowedIps || ''}
            onChange={e => updateField('maintenanceAllowedIps', e.target.value)}
            placeholder="관리자 IP 주소 (줄바꿈으로 구분)"
          />
          <div style={helperStyle}>점검 모드에서도 사이트에 접근할 수 있는 IP 주소 (줄바꿈으로 구분)</div>
        </div>
        {renderSaveButton(['isMaintenanceMode', 'maintenanceMessage', 'maintenanceAllowedIps'])}
      </div>
    );
  }

  const tabContent: Record<TabId, () => JSX.Element> = {
    basic: renderBasicTab,
    code: renderCodeTab,
    services: renderServicesTab,
    email: renderEmailTab,
    security: renderSecurityTab,
    maintenance: renderMaintenanceTab,
  };

  return (
    <div>
      <ToastContainer />
      <div style={s.header}><h1 style={s.title}>사이트 설정</h1></div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: `2px solid ${colors.border}`, marginBottom: 24,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? colors.primary : colors.textLight,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={s.card}>
        {tabContent[activeTab]()}
      </div>
    </div>
  );
}

export default SettingsPage;
