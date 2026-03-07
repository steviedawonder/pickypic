export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  isCta?: boolean;
}

export const navItems: NavItem[] = [
  { label: '회사소개', href: '/about' },
  { label: '제품소개', href: '/products' },
  { label: '포트폴리오', href: '/portfolio' },
  { label: '고객지원', href: '/support' },
  { label: '블로그', href: '/blog' },
  { label: '렌탈문의', href: '/rental', isCta: true },
];
