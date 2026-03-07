export interface PortfolioItem {
  id: string;
  client: string;
  category: string;
  image: string;
}

export const portfolioCategories = [
  '전체',
  'Modern Picky',
  'Classic Picky',
  'Urban Picky',
  'Modern Mini Picky',
  'Urban Mini Picky',
  'Modern Retro Picky',
  'Urban Retro Picky',
  'Outdoor Picky',
  'Air Picky',
] as const;

export const portfolioItems: PortfolioItem[] = [
  { id: '1', client: 'NETFLIX', category: 'Modern Picky', image: '/images/portfolio/netflix.jpg' },
  { id: '2', client: 'HYUNDAI', category: 'Classic Picky', image: '/images/portfolio/hyundai.jpg' },
  { id: '3', client: 'KIA', category: 'Urban Picky', image: '/images/portfolio/kia.jpg' },
  { id: '4', client: 'NEW BALANCE', category: 'Modern Picky', image: '/images/portfolio/newbalance.jpg' },
  { id: '5', client: 'rom&nd', category: 'Modern Mini Picky', image: '/images/portfolio/romand.jpg' },
  { id: '6', client: 'ZOOLUNGZOOLUNG', category: 'Urban Picky', image: '/images/portfolio/zoolung.jpg' },
  { id: '7', client: 'URBANPLAY', category: 'Modern Picky', image: '/images/portfolio/urbanplay.jpg' },
  { id: '8', client: 'CORNCENT', category: 'Classic Picky', image: '/images/portfolio/corncent.jpg' },
  { id: '9', client: 'THE HYUNDAI PANGYO', category: 'Urban Mini Picky', image: '/images/portfolio/hyundai-pangyo.jpg' },
  { id: '10', client: 'DAEWOONG', category: 'Modern Retro Picky', image: '/images/portfolio/daewoong.jpg' },
  { id: '11', client: 'MINIPOPZ', category: 'Air Picky', image: '/images/portfolio/minipopz.jpg' },
  { id: '12', client: 'ILSO', category: 'Urban Retro Picky', image: '/images/portfolio/ilso.jpg' },
  { id: '13', client: 'PANACOTA STUDIO', category: 'Outdoor Picky', image: '/images/portfolio/panacota.jpg' },
  { id: '14', client: 'HYUNDAI CITY OUTLETS', category: 'Modern Picky', image: '/images/portfolio/hyundai-outlets.jpg' },
];
