// AI 포토부스 스타일 갤러리 (/ai-photobooth/gallery)
//
// Styles are managed in the admin (Sanity type "aiStyle"). The list below is the
// fallback the gallery shows until the first style is saved there: the twelve
// samples already on /ai-photobooth, all made from one original shot.
// Categories stay in code so every style picks from the same translated list.

export interface Lang3 {
  ko: string;
  en: string;
  jp: string;
}

export interface AiStyleCategory {
  id: string;
  label: Lang3;
}

export const aiStyleCategories: AiStyleCategory[] = [
  { id: 'job', label: { ko: '직업', en: 'Careers', jp: '職業' } },
  { id: 'traditional', label: { ko: '전통·한복', en: 'Traditional', jp: '伝統・韓服' } },
  { id: 'timemachine', label: { ko: '타임머신', en: 'Time machine', jp: 'タイムマシン' } },
  { id: 'art', label: { ko: '화풍·일러스트', en: 'Art styles', jp: '画風・イラスト' } },
  { id: 'animation', label: { ko: '애니·웹툰', en: 'Anime & webtoon', jp: 'アニメ・ウェブトゥーン' } },
  { id: 'character', label: { ko: '캐릭터·피규어', en: 'Characters & figures', jp: 'キャラクター・フィギュア' } },
  { id: 'kpop', label: { ko: 'K-POP·아이돌', en: 'K-pop & idols', jp: 'K-POP・アイドル' } },
  { id: 'cinematic', label: { ko: '시네마틱', en: 'Cinematic', jp: 'シネマティック' } },
  { id: 'sports', label: { ko: '스포츠', en: 'Sports', jp: 'スポーツ' } },
  { id: 'beauty', label: { ko: '뷰티·화보', en: 'Beauty & editorial', jp: 'ビューティー・グラビア' } },
  { id: 'season', label: { ko: '시즌', en: 'Seasonal', jp: 'シーズン' } },
  { id: 'couple', label: { ko: '커플', en: 'Couples', jp: 'カップル' } },
  { id: 'family', label: { ko: '가족·단체', en: 'Family & groups', jp: '家族・団体' } },
  { id: 'pet', label: { ko: '반려동물', en: 'Pets', jp: 'ペット' } },
  { id: 'travel', label: { ko: '여행·지역', en: 'Travel & local', jp: '旅行・地域' } },
  { id: 'brand', label: { ko: '브랜드·광고', en: 'Brand & ads', jp: 'ブランド・広告' } },
  { id: 'card', label: { ko: '포토카드', en: 'Photo cards', jp: 'フォトカード' } },
  { id: 'miniature', label: { ko: '미니어처', en: 'Miniatures', jp: 'ミニチュア' } },
  { id: 'sf', label: { ko: 'SF·미래', en: 'Sci-fi & future', jp: 'SF・未来' } },
];

export type AiStylePeople = 'solo' | 'duo' | 'group';

export interface AiStyle {
  id: string;
  name: Lang3;
  desc?: Lang3;
  category: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  before?: string;
  people?: AiStylePeople;
  isNew?: boolean;
}

const ONE = '/images/ai-photobooth/';
const sample = (
  id: string,
  file: string,
  category: string,
  name: Lang3,
  desc: Lang3,
): AiStyle => ({
  id,
  name,
  desc,
  category,
  image: `${ONE}${file}`,
  imageWidth: 560,
  imageHeight: 835,
  before: `${ONE}one-original.jpg`,
  people: 'solo',
});

export const fallbackAiStyles: AiStyle[] = [
  sample('sample-figure', 'one-figure.jpg', 'character',
    { ko: '피규어 상자', en: 'Action figure box', jp: 'フィギュアの箱' },
    { ko: '포장 상자처럼 보이는 인화물', en: 'A print that looks like toy packaging', jp: 'パッケージ箱のようなプリント' }),
  sample('sample-card', 'one-card.jpg', 'card',
    { ko: '수집 카드', en: 'Trading card', jp: 'トレーディングカード' },
    { ko: '카드처럼 보이는 인화물', en: 'A print styled as a collectible card', jp: 'カードのようなプリント' }),
  sample('sample-editorial', 'one-editorial.jpg', 'beauty',
    { ko: '브랜드 화보', en: 'Brand editorial', jp: 'ブランドグラビア' },
    { ko: '그날 입은 옷으로', en: 'In the outfit you wore that day', jp: 'その日の服装のままで' }),
  sample('sample-santa', 'one-santa.jpg', 'season',
    { ko: '산타 기념사진', en: 'Photo with Santa', jp: 'サンタと記念撮影' },
    { ko: '겨울 시즌', en: 'Winter season', jp: '冬シーズン' }),
  sample('sample-jumbotron', 'one-jumbotron.jpg', 'sports',
    { ko: '중계 화면', en: 'Jumbotron', jp: 'スタジアムの中継画面' },
    { ko: '경기장·스포츠 행사', en: 'Stadiums and sports events', jp: 'スタジアム・スポーツイベント' }),
  sample('sample-webcam', 'one-webcam.jpg', 'timemachine',
    { ko: '2000년대 웹캠', en: '2000s webcam', jp: '2000年代のウェブカメラ' },
    { ko: '레트로 팝업', en: 'Retro pop-ups', jp: 'レトロなポップアップ' }),
  sample('sample-idol', 'one-idol.jpg', 'kpop',
    { ko: '아이돌이 된 나', en: 'Me as an idol', jp: 'アイドルになった私' },
    { ko: '팬덤·음악 행사', en: 'Fan and music events', jp: 'ファン・音楽イベント' }),
  sample('sample-future', 'one-future.jpg', 'timemachine',
    { ko: '미래의 나', en: 'Future me', jp: '未来の私' },
    { ko: '25년 뒤의 얼굴', en: 'Your face, 25 years on', jp: '25年後の顔' }),
  sample('sample-hanbok', 'one-hanbok.jpg', 'traditional',
    { ko: '한복', en: 'Hanbok', jp: '韓服' },
    { ko: '외국인 고객', en: 'International visitors', jp: '海外からのお客様' }),
  sample('sample-yearbook', 'one-yearbook.jpg', 'timemachine',
    { ko: '졸업앨범', en: 'Yearbook', jp: '卒業アルバム' },
    { ko: '90년대 사진관', en: "'90s photo studio", jp: '90年代の写真館' }),
  sample('sample-camcorder', 'one-camcorder.jpg', 'timemachine',
    { ko: '옛날 캠코더', en: 'Vintage camcorder', jp: '懐かしのビデオカメラ' },
    { ko: 'Y2K 팝업', en: 'Y2K pop-ups', jp: 'Y2Kポップアップ' }),
  sample('sample-pet', 'one-pet.jpg', 'pet',
    { ko: '반려동물', en: 'With your pet', jp: 'ペットと一緒に' },
    { ko: '동반 행사', en: 'Pet-friendly events', jp: 'ペット同伴イベント' }),
];

// Visitors' wishlist lives in their own browser; /rental reads the same key to
// pre-fill "관심 AI 스타일". Entries keep the Korean name so the inquiry stays
// readable for staff even if the style is later renamed or hidden.
export const AI_STYLE_WISHLIST_KEY = 'pickypic-ai-style-wishlist';
export interface AiStyleWish {
  id: string;
  name: string;
}
