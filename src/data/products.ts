export interface Product {
  id: string;
  name: string;
  nameKo: string;
  category: 'table' | 'stand' | 'booth';
  categoryLabel: string;
  dimensions: string;
  image: string;
  features: string[];
  description: string;
}

export const products: Product[] = [
  // 테이블형
  {
    id: 'urban-mini',
    name: 'Urban Mini',
    nameKo: '어반 미니',
    category: 'table',
    categoryLabel: '테이블형',
    dimensions: 'W350 x L350 x H400',
    image: '/images/products/urban-mini.jpg',
    features: ['컴팩트 디자인', '간편 설치', '테이블 위 배치'],
    description: '작은 공간에서도 설치 가능한 컴팩트 테이블형 포토부스',
  },
  {
    id: 'modern-mini',
    name: 'Modern Mini',
    nameKo: '모던 미니',
    category: 'table',
    categoryLabel: '테이블형',
    dimensions: 'W330 x L330 x H390',
    image: '/images/products/modern-mini.jpg',
    features: ['모던 디자인', '경량 구조', '다양한 래핑'],
    description: '세련된 디자인의 테이블형 미니 포토부스',
  },
  {
    id: 'modern-retro',
    name: 'Modern Retro Picky',
    nameKo: '모던 레트로피키',
    category: 'table',
    categoryLabel: '테이블형',
    dimensions: 'W290 x L290 x H310',
    image: '/images/products/modern-retro.jpg',
    features: ['레트로 감성', '소형 사이즈', '감성 인테리어'],
    description: '레트로 감성을 담은 소형 테이블 포토부스',
  },
  {
    id: 'urban-retro',
    name: 'Urban Retro Picky',
    nameKo: '어반 레트로 피키',
    category: 'table',
    categoryLabel: '테이블형',
    dimensions: 'W190 x L230 x H316',
    image: '/images/products/urban-retro.jpg',
    features: ['어반 스타일', '초소형', '이동 편리'],
    description: '어반 스타일의 초소형 레트로 포토부스',
  },
  // 스탠드형
  {
    id: 'modern-picky',
    name: 'Modern Picky',
    nameKo: '모던피키',
    category: 'stand',
    categoryLabel: '스탠드형',
    dimensions: 'W550 x L550 x H1,570',
    image: '/images/products/modern-picky.jpg',
    features: ['모던 디자인', '안정적 구조', '전체 래핑 가능'],
    description: '깔끔한 모던 디자인의 스탠드형 포토부스',
  },
  {
    id: 'classic-picky',
    name: 'Classic Picky',
    nameKo: '클래식피키',
    category: 'stand',
    categoryLabel: '스탠드형',
    dimensions: 'W550 x L550 x H1,570',
    image: '/images/products/classic-picky.jpg',
    features: ['클래식 디자인', '고급 마감', '다목적 활용'],
    description: '클래식한 매력의 스탠드형 포토부스',
  },
  {
    id: 'urban-picky',
    name: 'Urban Picky',
    nameKo: '어반피키',
    category: 'stand',
    categoryLabel: '스탠드형',
    dimensions: 'W500 x L500 x H1,440',
    image: '/images/products/urban-picky.jpg',
    features: ['어반 스타일', '슬림 디자인', '브랜드 커스텀'],
    description: '도시적 감각의 슬림 스탠드형 포토부스',
  },
  // 부스형
  {
    id: 'air-picky',
    name: 'Air Picky',
    nameKo: '에어피키',
    category: 'booth',
    categoryLabel: '부스형',
    dimensions: 'W930 x L930 x H2,350',
    image: '/images/products/air-picky.jpg',
    features: ['프라이빗 공간', '에어 구조', '대형 부스'],
    description: '프라이빗한 공간을 제공하는 에어 타입 포토부스',
  },
  {
    id: 'outdoor-picky',
    name: 'Outdoor Picky',
    nameKo: '아웃도어피키',
    category: 'booth',
    categoryLabel: '부스형',
    dimensions: 'W1,400 x L1,000 x H2,050',
    image: '/images/products/outdoor-picky.jpg',
    features: ['야외 전용', '대형 구조', '견고한 프레임'],
    description: '야외 행사를 위한 대형 아웃도어 포토부스',
  },
];

export const productCategories = [
  { id: 'all', label: '전체', labelEn: 'All' },
  { id: 'table', label: '테이블형', labelEn: 'Table' },
  { id: 'stand', label: '스탠드형', labelEn: 'Stand' },
  { id: 'booth', label: '부스형', labelEn: 'Booth' },
] as const;
