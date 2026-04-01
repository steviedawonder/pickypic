import type { ReactNode } from 'react';
import { colors, s, navItems } from './styles';

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}

export default function AdminLayout({ currentPage, onNavigate, children }: AdminLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, width: '100%', minWidth: 960 }}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>PICKYPIC 관리자</div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id === 'blogs' ? 'blogs' : item.id)}
              style={{
                ...s.navItem,
                ...(currentPage === item.id || (item.id === 'blogs' && ['blogs', 'blog-new', 'blog-edit'].includes(currentPage)) ? s.navItemActive : {}),
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textLight }}>
          <a href="/" target="_blank" rel="noopener" style={{ color: colors.textLight, textDecoration: 'none' }}>🌐 사이트 보기</a>
        </div>
      </aside>

      {/* Main Content */}
      <main style={s.main}>{children}</main>
    </div>
  );
}
