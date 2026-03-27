#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/portfolio-data.json', 'utf-8'));

const catMap = {
  '모던피키': 'modern-picky',
  '클래식피키': 'classic-picky',
  '어반피키': 'urban-picky',
  '모던_미니피키': 'modern-mini',
  '어반_미니피키': 'urban-mini',
  '모던_레트로피키': 'modern-retro',
  '어반_레트로피키': 'urban-retro',
  '아웃도어피키': 'outdoor',
  '에어피키': 'air',
};

const currentImages = {
  111: '/images/portfolio/portfolio-1.jpg', 110: '/images/portfolio/portfolio-2.jpg',
  108: '/images/portfolio/portfolio-3.jpg', 107: '/images/portfolio/portfolio-4.jpg',
  106: '/images/portfolio/portfolio-5.jpg', 105: '/images/portfolio/portfolio-6.jpg',
  104: '/images/portfolio/portfolio-7.jpg', 103: '/images/portfolio/portfolio-8.jpg',
  102: '/images/portfolio/portfolio-9.jpg', 101: '/images/portfolio/portfolio-10.jpg',
  94: '/images/portfolio/portfolio-11.jpg', 92: '/images/portfolio/portfolio-12.jpg',
  91: '/images/portfolio/portfolio-13.jpg', 90: '/images/portfolio/portfolio-14.jpg',
  89: '/images/portfolio/portfolio-15.jpg', 88: '/images/portfolio/portfolio-16.jpg',
  87: '/images/portfolio/portfolio-17.jpg', 86: '/images/portfolio/portfolio-18.jpg',
  85: '/images/portfolio/portfolio-19.jpg', 84: '/images/portfolio/portfolio-20.jpg',
  82: '/images/portfolio/portfolio-21.jpg', 81: '/images/portfolio/portfolio-22.jpg',
  80: '/images/portfolio/portfolio-23.jpg', 79: '/images/portfolio/portfolio-24.jpg',
  78: '/images/portfolio/portfolio-25.jpg', 77: '/images/portfolio/portfolio-26.jpg',
  76: '/images/portfolio/portfolio-27.jpg', 75: '/images/portfolio/portfolio-28.jpg',
  74: '/images/portfolio/portfolio-29.jpg', 73: '/images/portfolio/portfolio-30.jpg',
  72: '/images/portfolio/portfolio-31.jpg', 71: '/images/portfolio/portfolio-32.jpg',
  70: '/images/portfolio/portfolio-33.jpg', 69: '/images/portfolio/portfolio-34.jpg',
  68: '/images/portfolio/portfolio-35.jpg', 67: '/images/portfolio/portfolio-36.jpg',
  66: '/images/portfolio/portfolio-37.jpg', 65: '/images/portfolio/portfolio-38.jpg',
  64: '/images/portfolio/portfolio-39.jpg', 63: '/images/portfolio/portfolio-40.jpg',
  62: '/images/portfolio/portfolio-41.jpg', 61: '/images/portfolio/portfolio-42.jpg',
  60: '/images/portfolio/portfolio-43.jpg', 59: '/images/portfolio/portfolio-44.jpg',
  58: '/images/portfolio/portfolio-45.jpg', 51: '/images/portfolio/portfolio-46.jpg',
  50: '/images/portfolio/portfolio-47.jpg', 49: '/images/portfolio/portfolio-48.jpg',
  48: '/images/portfolio/portfolio-49.jpg', 47: '/images/portfolio/portfolio-50.jpg',
  46: '/images/portfolio/portfolio-51.jpg', 45: '/images/portfolio/portfolio-52.jpg',
  44: '/images/portfolio/portfolio-53.jpg', 43: '/images/portfolio/portfolio-54.jpg',
  42: '/images/portfolio/portfolio-55.jpg', 41: '/images/portfolio/portfolio-56.jpg',
  40: '/images/portfolio/portfolio-57.jpg', 39: '/images/portfolio/portfolio-58.jpg',
  38: '/images/portfolio/portfolio-59.jpg', 37: '/images/portfolio/portfolio-60.jpg',
  34: '/images/portfolio/portfolio-61.jpg', 33: '/images/portfolio/portfolio-62.jpg',
  32: '/images/portfolio/portfolio-63.jpg', 30: '/images/portfolio/portfolio-64.jpg',
  29: '/images/portfolio/portfolio-65.png', 28: '/images/portfolio/portfolio-66.png',
  27: '/images/portfolio/portfolio-67.png', 26: '/images/portfolio/portfolio-68.png',
  24: '/images/portfolio/portfolio-69.png', 23: '/images/portfolio/portfolio-70.png',
  22: '/images/portfolio/portfolio-71.png', 13: '/images/portfolio/portfolio-72.jpg',
  12: '/images/portfolio/portfolio-73.jpg', 11: '/images/portfolio/portfolio-74.jpg',
  9: '/images/portfolio/portfolio-75.jpg', 8: '/images/portfolio/portfolio-76.jpg',
};

const newThumbnails = {
  117: '/images/portfolio/portfolio-sulwhasoo.jpg',
  112: '/images/portfolio/portfolio-swarovski.jpg',
  10: '/images/portfolio/portfolio-corncert-10.jpg',
};

function cleanTitle(t) {
  return t.replace(/\s*\|\s*포토부스 렌탈$/, '').trim();
}

const items = data.map(d => {
  const id = d.wrId;
  return {
    id,
    title: cleanTitle(d.title),
    image: currentImages[id] || newThumbnails[id] || d.localImages[0] || '',
    category: catMap[d.categoryKo] || 'urban-picky',
    categoryKo: d.categoryKo,
    categoryEn: d.categoryEn,
    detailImages: d.localImages || [],
    description: d.description || '',
    rentalDevice: d.rentalDevice || '',
  };
});

// Generate TypeScript
let ts = `export interface PortfolioItem {
  id: number;
  title: string;
  image: string;
  category: string;
  categoryKo: string;
  categoryEn: string;
  detailImages: string[];
  description: string;
  rentalDevice: string;
}

export const portfolioCategories = [
  { id: 'all', label: '전체' },
  { id: 'modern-picky', label: '모던피키', labelEn: 'Modern Picky' },
  { id: 'classic-picky', label: '클래식피키', labelEn: 'Classic Picky' },
  { id: 'urban-picky', label: '어반피키', labelEn: 'Urban Picky' },
  { id: 'modern-mini', label: '모던_미니피키', labelEn: 'Modern Mini Picky' },
  { id: 'urban-mini', label: '어반_미니피키', labelEn: 'Urban Mini Picky' },
  { id: 'modern-retro', label: '모던_레트로피키', labelEn: 'Modern Retro Picky' },
  { id: 'urban-retro', label: '어반_레트로피키', labelEn: 'Urban Retro Picky' },
  { id: 'outdoor', label: '아웃도어피키', labelEn: 'Outdoor Picky' },
  { id: 'air', label: '에어피키', labelEn: 'Air Picky' },
] as const;

export const portfolioItems: PortfolioItem[] = [\n`;

for (const item of items) {
  ts += `  { id: ${item.id}, title: '${item.title.replace(/'/g, "\\'")}', image: '${item.image}', category: '${item.category}', categoryKo: '${item.categoryKo}', categoryEn: '${item.categoryEn}', detailImages: [${item.detailImages.map(i => `'${i}'`).join(', ')}], description: '${item.description.replace(/'/g, "\\'")}', rentalDevice: '${item.rentalDevice.replace(/'/g, "\\'")}' },\n`;
}

ts += `];\n`;

fs.writeFileSync('src/data/portfolio.ts', ts);
console.log('Generated src/data/portfolio.ts with', items.length, 'items');
