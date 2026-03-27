export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const navItems: NavItem[] = [
  { label: '회사소개', href: '/about' },
  { label: '제품소개', href: '/products' },
  { label: '렌탈문의', href: '/rental' },
  { label: '포트폴리오', href: '/portfolio' },
  { label: '고객지원', href: '/support' },
  { label: 'A.I 퍼스널컬러', href: '/ai-personal-color' },
  // { label: '블로그', href: '/blog' }, // 메뉴에서 임시 숨김
];
