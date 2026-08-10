import { translations, type Lang } from './translations';

const STORAGE_KEY = 'pickypic-lang';
const GEO_STORAGE_KEY = 'pickypic-geo';
const EN_BANNER_KEY = 'pickypic-en-banner-dismissed';
const VALID_LANGS: Lang[] = ['ko', 'en', 'jp'];
const WHITELISTED_IPS = ['221.138.56.243'];
let isOverseas: boolean | null = null;

export function getCurrentLang(): Lang {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored && VALID_LANGS.includes(stored)) return stored;
  return 'ko';
}

export function setLang(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations(lang);
  updateLangSelector(lang);
  updateShopVisibility(lang);
  document.documentElement.lang = lang === 'jp' ? 'ja' : lang;
  document.dispatchEvent(new CustomEvent('langChanged', { detail: lang }));
}

export function t(key: string, lang?: Lang): string {
  const l = lang ?? getCurrentLang();
  return translations[l]?.[key] ?? translations['ko'][key] ?? key;
}

export function applyTranslations(lang?: Lang): void {
  const l = lang ?? getCurrentLang();

  // Translate elements with data-i18n attribute (textContent)
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const translated = translations[l]?.[key] ?? translations['ko'][key];
    if (translated) {
      if (translated.includes('<br')) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }
  });

  // Translate placeholders with data-i18n-placeholder
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    const translated = translations[l]?.[key] ?? translations['ko'][key];
    if (translated) {
      el.placeholder = translated;
    }
  });

  // Translate aria-labels with data-i18n-aria
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) return;
    const translated = translations[l]?.[key] ?? translations['ko'][key];
    if (translated) {
      el.setAttribute('aria-label', translated);
    }
  });
}

function updateLangSelector(lang: Lang): void {
  document.querySelectorAll<HTMLElement>('.lang-btn').forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('text-black', 'font-bold');
      btn.classList.remove('text-gray-400', 'font-normal');
    } else {
      btn.classList.remove('text-black', 'font-bold');
      btn.classList.add('text-gray-400', 'font-normal');
    }
  });
}

// SHOP 메뉴 비공개 처리 — 항상 숨김
function updateShopVisibility(_lang?: Lang): void {
  document.querySelectorAll<HTMLElement>('.shop-nav-item').forEach((el) => {
    el.classList.add('hidden');
  });
}

async function detectGeoLocation(): Promise<void> {
  // Check cached result first (valid for 1 hour)
  try {
    const cached = localStorage.getItem(GEO_STORAGE_KEY);
    if (cached) {
      const { country, ip, timestamp } = JSON.parse(cached);
      const ONE_HOUR = 60 * 60 * 1000;
      if (Date.now() - timestamp < ONE_HOUR && ip) {
        isOverseas = country !== 'KR' || WHITELISTED_IPS.includes(ip);
        updateShopVisibility();
        updateEnglishBanner();
        return;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    const response = await fetch('https://api.country.is/');
    if (!response.ok) throw new Error('Geo API failed');
    const data = await response.json();
    const country = data.country || 'KR';
    const ip = data.ip || '';
    isOverseas = country !== 'KR' || WHITELISTED_IPS.includes(ip);
    localStorage.setItem(GEO_STORAGE_KEY, JSON.stringify({ country, ip, timestamp: Date.now() }));
  } catch {
    // On error, default to hiding SHOP (assume Korea)
    isOverseas = false;
  }
  updateShopVisibility();
  updateEnglishBanner();
}

// Suggest the English page to overseas visitors — never redirect them.
// Googlebot crawls from US IPs, so auto-switching on geo would serve English
// at Korean URLs and cost us the Korean rankings we already have.
function updateEnglishBanner(): void {
  if (!isOverseas) return;
  if (localStorage.getItem(EN_BANNER_KEY)) return;

  const banner = document.getElementById('en-suggest-banner');
  if (!banner) return;
  banner.classList.remove('hidden');

  banner.querySelector('.en-banner-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    banner.classList.add('hidden');
    localStorage.setItem(EN_BANNER_KEY, '1');
  });
}

// Auto-initialize
function init() {
  // /en/ routes are served as English HTML, but the shared chrome (Navbar,
  // Footer, contact button) is still data-i18n driven and ships with Korean
  // fallback text. So force 'en' instead of reading localStorage — a stored
  // 'ko' would actively overwrite the English page, and skipping the pass
  // entirely would leave the chrome in Korean. No geo banner, no storage write.
  if (window.location.pathname.startsWith('/en')) {
    applyTranslations('en');
    updateShopVisibility();
    return;
  }

  const lang = getCurrentLang();
  document.documentElement.lang = lang === 'jp' ? 'ja' : lang;
  applyTranslations(lang);
  updateLangSelector(lang);
  updateShopVisibility(lang);
  detectGeoLocation();
  // Reveal page after translations are applied (hides flash of Korean text)
  document.documentElement.style.visibility = '';
}

// Use event delegation for language buttons (works regardless of timing)
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.lang-btn');
  if (!btn) return;
  const newLang = btn.getAttribute('data-lang') as Lang;
  if (newLang && VALID_LANGS.includes(newLang)) {
    setLang(newLang);
  }
});

// Run immediately if DOM is already ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
document.addEventListener('astro:after-swap', init);
