import { colors, s } from '../shared/styles';

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

export default SettingsPage;
