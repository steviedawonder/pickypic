#!/usr/bin/env node
// One-time content formatting for paste-flattened blog posts.
// Applies subheadings / bold / lists / captions WITHOUT changing any words.
//
// Safety: every post is verified with a word-token diff — the sequence of
// [Hangul/alnum] tokens in the new body must EXACTLY equal the original's.
// Punctuation, whitespace, list markers ("- ") and line breaks may change;
// actual words may not. Any mismatch aborts that post (nothing is written).
//
//   node scripts/format-blog-posts.mjs            # dry-run all (no writes)
//   node scripts/format-blog-posts.mjs --apply    # write to Sanity
//   node scripts/format-blog-posts.mjs --only=hyundai [--apply]

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const token = (env.match(/^SANITY_API_TOKEN=(.+)$/m) || [])[1]?.trim();
if (!token) { console.error('SANITY_API_TOKEN not found in .env'); process.exit(1); }

const client = createClient({ projectId: '7b9lcco4', dataset: 'production', apiVersion: '2024-01-01', token, useCdn: false });

const APPLY = process.argv.includes('--apply');
const SHOWH = process.argv.includes('--headings');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').split('=')[1];

// ── Portable Text builder ───────────────────────────────────────────────
let _k = 0;
const key = () => `fmt${++_k}`;

// Build spans for a text string with optional bold substrings and links.
// opts: { bold: [substr...], links: [{find, href}] }
function spansFor(text, opts = {}) {
  const marks = [];   // {start, end, type, href?}
  const add = (sub, type, href) => {
    if (!sub) return;
    let from = 0, idx;
    while ((idx = text.indexOf(sub, from)) !== -1) {
      marks.push({ start: idx, end: idx + sub.length, type, href });
      from = idx + sub.length;
    }
  };
  (opts.bold || []).forEach(s => add(s, 'strong'));
  (opts.links || []).forEach(l => add(l.find, 'link', l.href));
  if (marks.length === 0) return { children: [{ _type: 'span', _key: key(), text, marks: [] }], markDefs: [] };

  // Split the string at every mark boundary; assign marks that cover each slice.
  const bounds = new Set([0, text.length]);
  marks.forEach(m => { bounds.add(m.start); bounds.add(m.end); });
  const pts = [...bounds].sort((a, b) => a - b);
  const markDefs = [];
  const children = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (a === b) continue;
    const slice = text.slice(a, b);
    const spanMarks = [];
    for (const m of marks) {
      if (m.start <= a && b <= m.end) {
        if (m.type === 'strong') spanMarks.push('strong');
        else if (m.type === 'link') {
          let def = markDefs.find(d => d._type === 'link' && d.href === m.href);
          if (!def) { def = { _type: 'link', _key: key(), href: m.href }; markDefs.push(def); }
          spanMarks.push(def._key);
        }
      }
    }
    children.push({ _type: 'span', _key: key(), text: slice, marks: spanMarks });
  }
  return { children, markDefs };
}

const block = (style, text, opts) => {
  const { children, markDefs } = spansFor(text, opts);
  return { _type: 'block', _key: key(), style, markDefs, children };
};
const listItem = (text, opts) => {
  const { children, markDefs } = spansFor(text, opts);
  return { _type: 'block', _key: key(), style: 'normal', listItem: 'bullet', level: 1, markDefs, children };
};

// Directive interpreter. `media` is the ordered array of preserved image/collage blocks.
function buildBody(directives, media) {
  const out = [];
  const usedMedia = new Set();
  for (const d of directives) {
    if (d.media !== undefined) { out.push(media[d.media]); usedMedia.add(d.media); }
    else if (d.h) out.push(block(d.h, d.text, d));
    else if (d.cap) out.push(caption(d.cap, d.links));
    else if (d.ul) d.items.forEach(it => {
      const t = typeof it === 'string' ? it : it.text;
      const opts = typeof it === 'string' ? {} : it;
      if (d.boldLabel && t.includes(':')) opts.bold = [t.slice(0, t.indexOf(':')).trim(), ...(opts.bold || [])];
      out.push(listItem(t, opts));
    });
    else out.push(block('normal', d.text ?? d.p, d));
  }
  // Append any media not explicitly placed (never drop an image).
  media.forEach((m, i) => { if (!usedMedia.has(i)) out.push(m); });
  return out;
}

// Captions: render italic via em mark. Patch spansFor usage for _caption/em.
// (Simple approach: wrap the whole caption text in em.)
function caption(text, links) {
  const { children, markDefs } = spansFor(text, { links });
  children.forEach(c => { if (!c.marks.includes('em')) c.marks = [...c.marks, 'em']; });
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children };
}

// ── Word-token safety diff ──────────────────────────────────────────────
// Character-preservation check: strip all whitespace / zero-width, then compare.
// This lets us INSERT spaces (to separate glued words) and line breaks freely,
// while guaranteeing not a single actual character of the content changed.
const chars = (s) => s.replace(/[\s​﻿]/g, '');
const tokens = (s) => (s.match(/[가-힣]+|[A-Za-z]+|[0-9]+/g) || []);
function bodyText(body) {
  return body.map(b => {
    if (b._type !== 'block' || !Array.isArray(b.children)) return '';
    return b.children.map(c => c.text || '').join('');
  }).join('\n');
}

// ── Reconstruct readable lines from a post body (same logic as the renderer) ──
function splitText(t) {
  if (!t) return t;
  let s = t;
  s = s.replace(/[​﻿]/g, '\n');
  s = s.replace(/\s*(https?:\/\/[^\s\n]+)\s*/g, '\n$1\n');
  s = s.replace(/([.!?])(?=[가-힣])/g, '$1\n');
  s = s.replace(/\s*(?=[📩🌐💬📷📍🚗📦✅⚠️🎯🌟])/gu, '\n');
  s = s.replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.replace(/^\n+/, '').trim();
}
function reconstructLines(body) {
  return (body || []).filter(b => b._type === 'block')
    .map(b => splitText((b.children || []).map(c => c.text || '').join('')))
    .join('\n').split('\n');
}

// ── Heuristic auto-formatter for the remaining paste-flattened posts ──────
// Never changes words: promotes short non-sentence lines to subheadings, groups
// body lines into paragraphs, bullets "- " lines, isolates URLs. Lines whose
// words are glued together (missing spaces) stay as-is — fixing them would alter
// the text, which we refuse to do.
const H2_HINT = /(문의|FAQ|자주 묻는 질문|핵심 차별점|제품 라인업|란\?|이유|최적|가치)/;
function isUrl(l) { return /^https?:\/\//.test(l.trim()); }
function looksHeading(l) {
  const t = l.trim();
  if (!t || t.length > 46 || isUrl(t)) return false;
  if (/^[-•]\s/.test(t) || /^\d+\.\s/.test(t)) return false;
  if (t.endsWith('?')) return true;
  // ends like a Korean/closing sentence → body, not heading
  if (/(다|요|죠|까|함|됨|음|임|세요|십니다|니다|는데요)[.!)\]]*$/.test(t)) return false;
  if (/[.!]$/.test(t) || /:\)$/.test(t)) return false;
  return true;
}
function autoDirectives(lines, media) {
  const dir = [];
  media.forEach((_, i) => dir.push({ media: i })); // keep all images up top
  let para = [];
  let bullets = [];
  const flushPara = () => { if (para.length) { dir.push({ text: para.join(' ') }); para = []; } };
  const flushBullets = () => { if (bullets.length) { dir.push({ ul: true, boldLabel: true, items: bullets.slice() }); bullets = []; } };
  const flushAll = () => { flushPara(); flushBullets(); };
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { flushAll(); continue; }
    if (isUrl(t)) { flushAll(); dir.push({ text: t, links: [{ find: t, href: t }] }); continue; }
    if (/^[-•]\s/.test(t)) { flushPara(); bullets.push(t.replace(/^[-•]\s+/, '')); continue; }
    flushBullets();
    if (looksHeading(t)) { flushPara(); dir.push({ h: H2_HINT.test(t) ? 'h2' : 'h3', text: t }); continue; }
    para.push(t);
  }
  flushAll();
  return dir;
}

// ── Per-post formatting definitions ─────────────────────────────────────
// Each returns directives from the ORIGINAL text (words copied verbatim).
const POSTS = {};

POSTS.hyundai = {
  match: '더현대',
  done: true, // already applied & verified; skip (its config strips "- ", incompatible with char check)
  build: (media) => buildBody([
    { media: 0 }, { media: 1 }, { media: 2 }, { media: 3 },
    { text: '포토부스 대여는 브랜드 팝업과 기업 행사에서 방문객의 콘텐츠 생성을 유도하는 가장 효과적인 방법입니다. 이 글에서는 2025년 4월 23일 더현대서울 YPHAUS VIP 라운지에서 진행된 비클린(BEECLIN) 팝업의 실제 포토부스 대여 사례를 통해, 렌탈 도입 전 반드시 확인해야 할 3가지 체크포인트를 정리합니다.', bold: ['3가지 체크포인트'] },
    { cap: '피키픽 어반피키 그린 포토부스 더현대서울 비클린 팝업 대여 설치 사례' },

    { h: 'h2', text: '포토부스 대여란 무엇인가요?' },
    { text: '포토부스 대여(렌탈)는 행사 기간 동안 포토부스 기기를 설치하고 운영한 뒤 종료 후 철수하는 단기 임대 서비스입니다. 기기를 직접 구매하지 않아도 되기 때문에 초기 비용 부담 없이 팝업스토어, 기업 행사, 브랜드 론칭, 웨딩 등 다양한 행사에 투입할 수 있습니다.', bold: ['단기 임대 서비스'] },
    { text: '특히 브랜드 팝업에서 포토부스 렌탈이 주목받는 이유는 명확합니다. 방문객이 커스텀 프레임으로 사진을 찍고 SNS에 공유하는 순간, 포토부스는 브랜드 콘텐츠 자동 생성 도구가 됩니다. 인스타그램 1회 공유당 평균 팔로워 수 이상의 추가 노출이 발생하며, 이는 유료 광고 없이 얻을 수 있는 가장 효율적인 브랜드 확산 방식입니다.', bold: ['브랜드 콘텐츠 자동 생성 도구'] },
    { text: '포토부스 대여 시장에서는 즉석인화 방식과 커스텀 프레임 디자인 적용 여부가 업체 선택의 핵심 기준입니다.', bold: ['즉석인화 방식', '커스텀 프레임 디자인'] },

    { cap: '피키픽 어반피키 그린 포토부스 더현대서울 비클린 팝업 대여 설치 사례' },
    { h: 'h2', text: '더현대서울 비클린 팝업 — 포토부스 대여 현장 정보' },
    { text: '2025년 4월 23일, 더현대서울 YPHAUS(VIP 라운지)에서 뷰티 브랜드 비클린(BEECLIN)의 브랜드 팝업이 진행되었습니다. 피키픽(PICKYPIC)의 어반피키(Urban Picky) 기기가 해당 현장에 대여·설치되었습니다.' },
    { h: 'h3', text: '현장 기본 정보' },
    { ul: true, boldLabel: true, items: [
      '설치 장소 : 더현대서울 YPHAUS VIP 라운지',
      '팝업 브랜드 : 비클린 (BEECLIN)',
      '진행 일자 : 2025년 4월 23일',
      '대여 기기 : 피키픽 어반피키 (Urban Picky) — 그린 컬러',
      '설치 대수 : 1대',
      '출력 방식 : 즉석인화 (현장 바로 출력)',
      '적용 프레임 : 2×6 inches 커스텀 디자인',
    ] },
    { text: '더현대서울은 국내 팝업 마케팅의 핵심 공간입니다. 그중 YPHAUS는 VIP 전용 라운지로, 공간의 브랜드 감도와 기기 디자인 완성도가 직접적으로 연결되는 장소입니다. 이번 비클린 팝업에서 포토부스 기기 선택 기준은 단순한 기능이 아닌 브랜드 경험의 연장이었습니다.' },

    { cap: '피키픽 포토부스 대여' },
    { h: 'h2', text: '포토부스 대여 전 반드시 확인할 3가지 체크포인트' },
    { text: '포토부스 렌탈을 처음 알아보는 담당자라면 아래 3가지를 반드시 확인하세요. 이번 비클린 사례는 3가지 모두 충족한 케이스입니다.' },

    { cap: '포토부스 대여 실제 프례임' },
    { h: 'h3', text: '1. 기기 컬러가 브랜드 키컬러와 일치하는가?' },
    { text: '포토부스 기기 자체가 공간 연출의 일부입니다. 기기 컬러가 브랜드 톤과 어긋나면 사진 배경에 이질감이 생기고 SNS 공유 콘텐츠의 퀄리티도 떨어집니다.' },
    { text: '비클린은 브랜드 키컬러인 그린 계열에 맞춰 피키픽 어반피키 그린 컬러 기기를 선택했습니다. YPHAUS 라운지 인테리어와 자연스럽게 어우러지는 동시에, 비클린의 브랜드 아이덴티티를 공간에서 강화했습니다.' },
    { text: '피키픽 어반피키는 다양한 컬러 라인업을 보유하고 있어 브랜드 키컬러에 맞는 기기 배정이 가능합니다.' },

    { h: 'h3', text: '2. 커스텀 프레임 디자인이 가능한가?' },
    { text: '즉석인화 사진에서 프레임은 브랜드 로고와 메시지를 담는 핵심 공간입니다. 커스텀 프레임이 없다면 방문객이 공유하는 사진에 브랜드가 노출되지 않습니다.' },
    { text: '피키픽은 4×6 inches와 2×6 inches 두 가지 규격 모두 커스텀 디자인 적용을 지원합니다. 이번 비클린 팝업에는 2×6 inches 규격에 비클린 브랜드 커스텀 디자인이 적용되었습니다. 브랜드 로고 파일과 가이드라인만 공유하면 피키픽에서 직접 제작해 적용합니다.' },

    { h: 'h3', text: '3. 즉석인화 방식인가, 디지털 전송 방식인가?' },
    { text: '포토부스 출력 방식은 크게 즉석인화(실물 출력)와 디지털 전송(QR코드·문자 발송)으로 나뉩니다. VIP 행사나 프리미엄 팝업에서는 즉석인화 방식이 방문객 만족도와 체험 완성도를 훨씬 높입니다. 실물 사진을 현장에서 바로 받아가는 경험 자체가 브랜드 기억에 남기 때문입니다.' },
    { text: '이번 비클린 YPHAUS 팝업에서도 즉석인화 방식이 적용되었습니다. 피키픽 어반피키는 즉석인화를 기본으로 지원하며, 현장 출력 속도와 인화 품질 모두 안정적입니다.' },

    { h: 'h2', text: '포토부스 대여 자주 묻는 질문 (FAQ)' },
    { h: 'h3', text: '포토부스 대여 비용은 어떻게 책정되나요?' },
    { text: '포토부스 대여 비용은 대여 기간, 기기 수량, 커스텀 디자인 유무, 설치 장소, 운영 인원 포함 여부에 따라 달라집니다. 피키픽 공식 홈페이지에서 행사 정보를 함께 전달하면 1시간 이내 맞춤 견적을 받을 수 있습니다.' },
    { h: 'h3', text: '하루짜리 단기 포토부스 대여도 가능한가요?' },
    { text: '1일 단위 단기 렌탈도 가능합니다. 이번 비클린 팝업처럼 당일 설치·운영·철수까지 포함된 형태로 진행됩니다.' },
    { h: 'h3', text: '더현대서울, 백화점 등 상업 공간에도 설치할 수 있나요?' },
    { text: '더현대서울 YPHAUS VIP 라운지를 포함해 백화점, 쇼룸, 팝업 부스 등 다양한 상업 공간 설치 경험이 있습니다. 공간 동선과 규모에 맞는 배치 컨설팅도 함께 제공합니다.' },

    { h: 'h2', text: '어반피키(Urban Picky)는 어떤 기기인가요?' },
    { text: '어반피키는 피키픽이 자체 운영하는 포토부스 기기입니다. 감각적인 외형 디자인과 안정적인 즉석인화 성능을 갖추고 있으며, 브랜드 팝업과 프리미엄 행사에 최적화된 기기입니다. 4×6 inches 및 2×6 inches 프레임 규격을 모두 지원하며, 커스텀 디자인 적용이 가능합니다.' },

    { h: 'h2', text: '포토부스 대여 견적 및 문의' },
    { text: '브랜드 팝업, 기업 행사, 웨딩, 파티 등 행사 유형에 맞는 맞춤 견적을 제공합니다.' },
    { text: '1. 공식 홈페이지 견적 신청 → https://picky-pic.com/rental', links: [{ find: 'https://picky-pic.com/rental', href: 'https://picky-pic.com/rental' }] },
    { text: '2. 카카오톡 채널 빠른 문의 → https://pf.kakao.com/_qbEMb', links: [{ find: 'https://pf.kakao.com/_qbEMb', href: 'https://pf.kakao.com/_qbEMb' }] },
    { text: '3. 인스타그램 대여 사례 확인 → https://www.instagram.com/pickypic.official/', links: [{ find: 'https://www.instagram.com/pickypic.official/', href: 'https://www.instagram.com/pickypic.official/' }] },
    { text: '포토부스 대여를 처음 알아본다면 공식 홈페이지에서 포토부스 구매와 렌탈 비교 안내도 함께 확인할 수 있습니다. → 피키픽 홈페이지 바로가기 : https://picky-pic.com', links: [{ find: 'https://picky-pic.com', href: 'https://picky-pic.com' }] },
  ], media),
};

POSTS.carevent = {
  match: '자동차', titleEmpty: true,
  build: (media) => buildBody([
    { text: '📌 이 글은 실제 자동차 브랜드 행사 포토부스 대여 사례 3건을 정리한 글입니다.' },
    { text: 'BMW 코오롱모터스, 미니쿠퍼, 기아 셀토스', bold: ['BMW 코오롱모터스, 미니쿠퍼, 기아 셀토스'] },
    { text: '각각의 브랜드 콘셉트에 맞는 기기와 커스텀 프레임이 적용된 현장입니다. 포토부스 대여로 행사의 통일성을 완성하는 방법을 확인하세요.' },
    { h: 'h2', text: '자동차 행사에서 포토부스 대여가 필요한 이유' },
    ...Array.from({ length: 16 }, (_, i) => ({ media: i })),
    { text: '자동차 브랜드 행사는 단순한 제품 전시를 넘어 브랜드 경험을 전달하는 공간입니다. 방문객이 차량 옆에서 사진을 찍고 SNS에 공유하는 순간, 포토부스는 브랜드 콘텐츠 생성 도구가 됩니다. 포토부스 대여 시 브랜드 행사에서 효과가 극대화되는 이유는 3가지입니다.', bold: ['브랜드 콘텐츠 생성 도구'] },
    { h: 'h2', text: '자동차 행사 포토부스 대여 실제 사례' },
    { text: '1. 커스텀 프레임에 차량 모델명·브랜드 로고를 담아 공유 사진마다 자연스러운 홍보 효과 발생' },
    { text: '2. 기기 디자인이 행사 공간 인테리어와 어우러져 전체 연출의 통일성 완성' },
    { text: '3. 즉석인화로 방문객이 실물 기념품을 받아가며 브랜드 기억도 상승' },
    { text: '피키픽(PICKYPIC)은 모던피키, 아웃도어피키, 클래식피키 등 다양한 기기 라인업을 통해 각 행사 콘셉트에 맞는 포토부스 대여를 지원합니다. 아래 3가지 자동차 브랜드 행사 사례에서 구체적으로 확인하세요.' },

    { h: 'h2', text: '사례 1 | BMW 코오롱모터스 — 모던피키 원목 기기 대여' },
    { ul: true, boldLabel: true, items: [
      '📍 설치 장소 : 코오롱모터스 BMW 광주전시장 & BMW 코오롱모터스 순천전시장',
      '🚗 브랜드 : BMW 코오롱모터스',
      '📦 대여 기기 : 피키픽 모던피키 (Modern Picky) — 원목 소재',
    ] },
    { cap: '피키픽포토부스 - 모던피키 -' },
    { h: 'h3', text: '[모던피키란?]' },
    { text: '모던피키는 원목 소재로 제작된 피키픽의 포토부스 기기입니다. 자연스러운 나무 질감이 고급스러운 공간 분위기를 만들어내며, BMW 전시장처럼 프리미엄 브랜드 환경에 자연스럽게 어우러집니다. 플라스틱 기기와 달리 원목 특유의 따뜻한 질감이 전시 공간의 완성도를 높입니다.' },
    { cap: 'BMW 코오롱모터스 광주/순천 전시장 포토부스대여' },
    { h: 'h3', text: '[이 현장에서 모던피키가 선택된 이유]' },
    { cap: '브랜드 로고가 들어간 커스텀 프레임' },
    { text: 'BMW 코오롱모터스 전시장은 차량 자체의 고급스러움을 공간 전체에서 전달해야 하는 환경입니다. 기기 소재부터 디자인까지 브랜드 감도에 맞아야 했고, 원목 소재의 모던피키가 전시장 인테리어와 자연스럽게 통일감을 형성했습니다. 광주전시장과 순천전시장 두 곳에 동시 적용되어, 지역이 달라도 동일한 브랜드 경험을 제공했습니다. 또한 BMW 코오롱모터스 커스텀 프레임이 제작·적용되어 방문객 사진마다 브랜드 아이덴티티가 담겼습니다.' },

    { h: 'h2', text: '사례 2 | 미니쿠퍼 — 아웃도어피키 부스형 기기 대여' },
    { cap: '미니쿠퍼 폴스미스에디션 팝업 행사 포토부스대여' },
    { ul: true, boldLabel: true, items: [
      '📍 설치 장소 : 용산 이태원 — 더퍼펙트매치: 폴스미스 에디션 팝업',
      '🚗 브랜드 : 미니쿠퍼 (MINI Cooper)',
      '📦 대여 기기 : 피키픽 아웃도어피키 (Outdoor Picky) — 부스형',
    ] },
    { cap: '피키픽 포토부스 - 아웃도어 피키 -' },
    { h: 'h3', text: '[아웃도어피키란?]' },
    { text: '아웃도어피키는 독립 부스 형태의 포토부스 기기입니다. 기기 자체가 하나의 포토 부스 공간을 형성하기 때문에, 팝업스토어처럼 개방된 공간에서도 독립적인 포토존을 만들 수 있습니다. 방문객이 부스 안으로 들어가 촬영하는 방식으로, 몰입감 있는 사진 경험을 제공합니다.' },
    { h: 'h3', text: '[이 현장에서 아웃도어피키가 선택된 이유]' },
    { cap: '미니쿠퍼 × 폴스미스 에디션 커스텀 프레임' },
    { text: '미니쿠퍼 × 폴스미스 에디션 팝업은 이태원이라는 감도 높은 공간에서 진행된 컬래버레이션 행사입니다. 팝업 특유의 개방형 공간 구조에서 독립적인 포토존을 만들기 위해 부스형 아웃도어피키가 선택되었습니다. 미니쿠퍼의 유니크하고 개성 있는 브랜드 이미지와 폴스미스의 컬러풀한 감성이 부스 디자인과 커스텀 프레임에 함께 반영되었습니다. 팝업 방문객이 부스 안에서 찍은 사진은 미니쿠퍼 × 폴스미스 컬래버레이션 콘텐츠로 SNS에 자연스럽게 확산되었습니다.' },

    { h: 'h2', text: '사례 3 | 기아 셀토스 — 클래식피키 원목 기기 대여' },
    { ul: true, boldLabel: true, items: [
      '📍 설치 장소 : 잠실 롯데타워몰 1층 아트리움',
      '🚗 브랜드 : 기아 (KIA) 셀토스',
      '📦 대여 기기 : 피키픽 클래식피키 (Classic Picky) — 원목 소재, 신문지 질감 출력',
    ] },
    { h: 'h3', text: '[클래식피키란?]' },
    { cap: '피키픽포토부스 - 클래식피키 -' },
    { text: '클래식피키는 원목 소재 기기에 신문지 질감의 독특한 출력 방식이 결합된 피키픽의 포토부스 기기입니다. 일반 즉석인화와 달리 신문지 느낌의 흑백톤 출력이 가능해, 감성적이고 레트로한 무드의 사진 결과물을 만들어냅니다. 기기 자체의 원목 질감과 출력물의 신문지 느낌이 조화를 이루어 독보적인 포토부스 경험을 제공합니다.' },
    { h: 'h3', text: '[이 현장에서 클래식피키가 선택된 이유]' },
    { cap: '클래식피키 커스텀 프레임' },
    { text: '롯데타워몰 1층 아트리움은 높은 천장과 넓은 공간이 특징인 대형 전시 공간입니다. 기아 더 뉴 셀토스 론칭 행사에서 차량의 개성과 감성적인 무드를 전달하기 위해 클래식피키가 선택되었습니다. 신문지 질감 출력이라는 차별화된 결과물이 방문객에게 특별한 기념 사진 경험을 제공하는 동시에, 셀토스의 독자적인 브랜드 감성과 맞아 떨어졌습니다. 셀토스 전용 커스텀 프레임이 클래식피키의 레트로 감성과 결합되어, 다른 자동차 행사와 차별화된 포토부스 경험을 완성했습니다.' },

    { h: 'h2', text: '3가지 사례로 보는 포토부스 대여 핵심 — 행사 통일성' },
    { cap: '행사 분위기에 맞춘 커스텀 랩핑 포토부스' },
    { text: '위 3가지 자동차 브랜드 행사 사례의 공통점은 하나입니다. 기기 선택부터 커스텀 프레임 디자인, 외부 랩핑까지 행사 콘셉트와 브랜드 아이덴티티에 맞게 포토부스 전체를 맞춤 구성했다는 점입니다.' },
    { h: 'h3', text: '포토부스 대여에서 행사 통일성을 만드는 3가지 요소' },
    { text: '1. 기기 소재·디자인 선택 : 공간 인테리어와 브랜드 톤에 맞는 기기 (원목/부스형 등)' },
    { text: '2. 커스텀 프레임 제작 : 차량 모델명, 브랜드 로고, 행사 테마가 담긴 전용 디자인' },
    { text: '3. 출력 방식 선택 : 행사 무드에 맞는 출력 결과물 (컬러 즉석인화 / 신문지 질감 등)' },
    { text: '이 3가지가 일치할 때, 포토부스는 단순한 촬영 도구가 아닌 행사 브랜딩의 완성 요소가 됩니다.' },

    { h: 'h2', text: '포토부스 대여 자주 묻는 질문 (FAQ)' },
    { h: 'h3', text: 'Q. 자동차 전시장이나 팝업 행사에도 포토부스 대여가 가능한가요?' },
    { text: 'A. 가능합니다. BMW 전시장, 롯데타워몰 아트리움, 이태원 팝업 공간 등 다양한 상업·전시 공간에 설치 경험이 있습니다. 공간 규모와 동선에 맞는 기기 배치 컨설팅도 함께 제공됩니다.' },
    { h: 'h3', text: 'Q. 기기 종류는 어떻게 선택하나요?' },
    { text: 'A. 행사 콘셉트와 공간 환경에 따라 다양한 모델 중 적합한 기기를 추천해 드립니다.' },
    { text: 'https://blog.naver.com/pickypicphotobooth/224238491560 https://blog.naver.com/pickypicphotobooth/224238491560 [피키픽 포토부스] - 피키픽 포토부스 제품 소개 안녕하세요. 최고의 순간을 기록하고 경험을 제공하는 피키픽 포토부스(pickypic photobooth)입니다. 오늘...blog.naver.com', links: [{ find: 'https://blog.naver.com/pickypicphotobooth/224238491560', href: 'https://blog.naver.com/pickypicphotobooth/224238491560' }] },
    { h: 'h3', text: 'Q. 커스텀 프레임 디자인은 어떻게 진행되나요?' },
    { text: 'A. 홈페이지 내 가이드라인 파일을 제공해드립니다. 해당 가이드라인 파일에 맞춰 커스텀이 가능합니다.' },
    { h: 'h3', text: 'Q. 여러 지역 행사장에 동시 설치도 가능한가요?' },
    { text: 'A. 가능합니다. BMW 코오롱모터스 광주·순천 전시장 사례처럼 복수 거점 동시 설치를 지원합니다.*한 달 전 예약 문의 필수' },
    { h: 'h3', text: 'Q. 포토부스 대여 비용은 어떻게 책정되나요?' },
    { text: 'A. 기기 종류, 대여 기간, 설치 장소, 커스텀 디자인 유무에 따라 달라집니다. 공식 홈페이지에서 행사 정보와 함께 견적 문의 시 빠르게 안내해 드립니다.' },

    { h: 'h2', text: '📩 포토부스 대여 견적 및 문의' },
    { text: '자동차 행사, 브랜드 팝업, 기업 행사 등 모든 행사 유형에 맞춤 포토부스 대여 서비스를 제공합니다. 영업시간 내 1시간 이내 답변을 원칙으로 합니다.' },
    { h: 'h3', text: '🌐 공식 홈페이지 (견적 문의)' },
    { text: 'https://picky-pic.com/rental', links: [{ find: 'https://picky-pic.com/rental', href: 'https://picky-pic.com/rental' }] },
    { h: 'h3', text: '💬 카카오톡 채널 (빠른 문의)' },
    { text: 'https://pf.kakao.com/_qbEMb', links: [{ find: 'https://pf.kakao.com/_qbEMb', href: 'https://pf.kakao.com/_qbEMb' }] },
    { h: 'h3', text: '📷 인스타그램 (대여 사례 피드)' },
    { text: 'https://www.instagram.com/pickypic.official/', links: [{ find: 'https://www.instagram.com/pickypic.official/', href: 'https://www.instagram.com/pickypic.official/' }] },
  ], media),
};

POSTS.brand = {
  match: 'pickypic-photobooth-rental-purchase',
  build: (media) => buildBody([
    { media: 0 },
    { cap: '피키픽포토부스 시그니처 모델 : 모던 피키 (원목 포토부스)' },
    { text: '피키픽포토부스(PickyPic Photobooth)는 인테리어와 완벽하게 어우러지는 디자인 포토부스를 개발·제조·공급하는 대한민국 대표 포토부스대여·판매·운영 전문 브랜드입니다. 전국 200대 이상의 운영 실적과 미국·일본·싱가포르·프랑스 등 글로벌 수출 경험을 바탕으로, 카페·호텔·팝업스토어·백화점·기업행사 등 다양한 공간에 최적화된 포토부스대여 • 판매 솔루션을 제공합니다.', bold: ['대한민국 대표 포토부스대여·판매·운영 전문 브랜드', '전국 200대 이상'] },
    { media: 1 }, { media: 2 }, { media: 3 }, { media: 4 }, { media: 5 }, { media: 6 },

    { h: 'h2', text: '피키픽포토부스란? — 공간을 위한 새로운 포토부스대여 기준' },
    { text: "기존 포토부스 시장은 '인O네컷'처럼 매장형 포토부스 기계가 주류였습니다. 이런 제품들은 전용 매장이 아니면 설치 자체가 어렵고, 인테리어와 동떨어진 이질적인 외관 때문에 브랜드 공간과 어울리지 않는다는 한계가 있었습니다." },
    { text: '제품 크기를 50% 이상 줄이고 디자인 재해석을 통해 오브제 느낌의 포토부스를 탄생시켰습니다.' },
    { text: '피키픽포토부스는 이 문제를 정면으로 해결했습니다. 원목과 아크릴 같은 감각적인 소재를 포토부스에 최초로 도입하고, 제품을 대폭 소형화하여 어떤 실내 공간에도 자연스럽게 녹아드는 디자인 포토부스를 탄생시켰습니다. 공간의 컨셉에 맞게 기기 랩핑(외관 커스터마이징)도 가능하여, 브랜드 아이덴티티를 해치지 않으면서도 포토부스의 모든 기능을 갖출 수 있습니다.', bold: ['원목과 아크릴 같은 감각적인 소재를 포토부스에 최초로 도입'] },
    { text: '공간의 일부가 되는 포토부스 — 그것이 피키픽포토부스가 추구하는 가치입니다.' },

    { h: 'h2', text: '제품 라인업 — 공간과 목적에 따라 선택하는 4가지 모델' },
    { text: '피키픽포토부스는 설치 환경과 운영 목적에 맞게 선택할 수 있는 4가지 제품 라인업을 보유하고 있습니다. 어떤 공간이든, 어떤 고객이든 최적의 선택지를 제공합니다.' },

    { h: 'h3', text: '1. 레트로피키 — 높이 30cm 초소형 영수증 포토부스' },
    { cap: '피키픽 포토부스 영수증 사진기 (레트로피키)' },
    { text: '레트로피키는 높이 30cm에 불과한 초소형 포토부스입니다. 영수증 형태의 감성적인 사진 출력 방식을 채택하여 독특한 사용 경험을 제공하며, 테이블 위 어디에나 올려두고 즉시 운영할 수 있습니다. 작은 공간에서 큰 임팩트를 원하는 카페·편집샵·소규모 팝업스토어에 특히 적합한 모델입니다.' },
    { ul: true, boldLabel: true, items: ['타입: 초소형 테이블형', '출력 방식: 영수증 포토 프린트', '적합 공간: 카페, 편집샵, 소규모 팝업, 프리미엄 굿즈샵'] },

    { h: 'h3', text: '2. 미니피키 — 테이블형 컴팩트 포토부스' },
    { cap: '피키픽 포토부스 - 미니피키 어반 (아크릴)' },
    { text: '미니피키는 포토부스의 모든 핵심 기능을 그대로 담으면서도 크기를 대폭 줄인 테이블형 포토부스입니다. 테이블 위에 올려두고 손쉽게 운영할 수 있어 설치 자유도가 매우 높습니다. 앉아서 또는 서서 편하게 촬영할 수 있으며, 이동과 재배치가 쉬워 팝업스토어나 임시 행사장에서도 최상의 활용도를 자랑합니다.' },
    { ul: true, boldLabel: true, items: ['타입: 소형 테이블형'] },
    { cap: '피키픽 포토부스 - 미니피키 모던 (원목)' },
    { ul: true, boldLabel: true, items: ['적합 공간: 카페, 레스토랑, 부티크 호텔, 기업 행사, 팝업스토어'] },

    { h: 'h3', text: '3. 모던피키 — 스탠드형 포토부스 (모던 스타일)' },
    { cap: '피키픽포토부스 - 모던 피키 (원목)' },
    { text: '모던피키는 편하게 서서 촬영할 수 있는 스탠드형 포토부스입니다. 깔끔하고 현대적인 디자인으로 호텔 로비, 백화점, 쇼핑몰, 리조트 등 세련된 공간에 자연스럽게 어울립니다. 일반적인 포토부스 대비 압도적으로 작은 공간만으로도 운영이 가능하여 효율성이 높습니다.' },
    { ul: true, boldLabel: true, items: ['타입: 스탠드형', '디자인: 모던 / 미니멀', '적합 공간: 호텔, 백화점, 쇼핑몰, 리조트, 브랜드 쇼룸'] },

    { h: 'h3', text: '4. 어반피키 — 스탠드형 포토부스 (어반 스타일)' },
    { cap: '피키픽포토부스 - 어반피키 (스댄트형/아크릴)' },
    { text: '어반피키는 스탠드형 타입에 감각적인 어반 디자인을 더한 모델입니다. 개성 있는 브랜드 공간이나 트렌디한 F&B 매장, 놀이동산, 키즈카페 등에 어울리는 스타일로, 공간에 생동감을 불어넣고 고객의 체류 시간을 자연스럽게 늘려줍니다.' },
    { ul: true, boldLabel: true, items: ['타입: 스탠드형', '디자인: 어반 / 트렌디', '적합 공간: 키즈카페, 놀이동산, 트렌디 카페, 복합문화공간'] },

    { h: 'h2', text: '피키픽포토부스의 핵심 차별점' },
    { h: 'h3', text: '① 결제 시스템 탑재 — 유료 운영으로 실질적인 수익 창출' },
    { text: '피키픽포토부스의 가장 강력한 차별점 중 하나는 카드·현금 결제 시스템 내장입니다. 기존 포토부스 기기 대부분은 무료 촬영 전용으로 설계되어 있어, 행사 홍보 목적 외에는 수익을 올리기 어렵습니다. 반면 피키픽포토부스는 무인 키오스크 방식의 결제 시스템을 기본으로 탑재하고 있어, 설치 이후 별도의 인력 없이도 안정적인 수익을 만들어낼 수 있습니다.', bold: ['카드·현금 결제 시스템 내장'] },
    { ul: true, boldLabel: true, items: [
      '팝업스토어·기업 행사 활용 시: 무료 모드로 전환하여 무제한 촬영 프로모션 진행 가능',
      '카페·식당·백화점·호텔 상시 운영 시: 유료 결제 모드로 전환하여 고정 수익원으로 활용',
      '무인 운영: 별도 운영 인력 없이 24시간 자동 운영 가능',
    ] },

    { h: 'h3', text: '② 공간을 선택하지 않는 인테리어 친화적 설계' },
    { text: '기존 포토부스는 크기와 외관 탓에 설치 가능한 공간이 제한적이었습니다. 피키픽포토부스는 원목과 아크릴 등 기존 포토부스 업계에서 사용되지 않던 소재를 채택하고, 철저한 미니멀·모던 디자인 철학을 바탕으로 제품을 설계했습니다. 그 결과, 어느 공간에 놓아도 이질감 없이 어우러지는 인테리어 포토부스가 탄생했습니다. 여기에 기기 랩핑 서비스를 통해 브랜드 컬러나 로고, 패턴을 입힐 수 있어 완전한 커스텀 포토부스 제작도 가능합니다.' },

    { h: 'h3', text: '③ 약 1평의 유휴 공간을 수익 공간으로 전환' },
    { text: '포토부스 설치에 필요한 공간은 약 1평(3.3㎡) 남짓에 불과합니다. 매장 한 켠의 비어 있던 공간, 복도 끝의 유휴 공간, 로비 한쪽 코너만으로도 포토부스 수익 공간을 만들 수 있습니다. 매장에 새로운 콘텐츠 요소가 생기면 SNS 업로드와 입소문으로 자연스러운 트래픽이 증가하며, 고객의 체류 시간이 늘어나는 효과도 함께 기대할 수 있습니다. 포토부스 하나로 공간의 가치를 완전히 새롭게 바꿀 수 있습니다.', bold: ['약 1평(3.3㎡)'] },

    { h: 'h3', text: '④ 검증된 글로벌 운영 실적' },
    { text: '피키픽포토부스는 단순한 아이디어 제품이 아닙니다. 현재 전국 200대 이상의 기기를 실제 상업 공간에 설치·운영 중이며, 그 성과를 바탕으로 해외 시장 진출에도 성공했습니다.', bold: ['전국 200대 이상'] },
    { ul: true, boldLabel: true, items: ['수출 국가: 미국, 일본, 싱가포르, 대만, 홍콩, 캐나다, 프랑스, 룩셈부르크'] },
    { text: '국내외 다양한 환경에서 검증된 안정적인 기기 성능과 운영 노하우를 제공합니다.' },

    { h: 'h2', text: '이런 공간에 최적입니다' },
    { text: '피키픽포토부스는 다음과 같은 공간·상황에 최적화되어 있습니다.' },
    { h: 'h3', text: '상업 공간 상시 운영' },
    { ul: true, items: [
      '카페, 브런치 레스토랑, 이자카야 등 F&B 매장',
      '백화점, 쇼핑몰, 편집샵',
      '호텔 로비, 부티크 호텔, 리조트',
      '키즈카페, 놀이동산, 복합 문화 공간',
    ] },
    { h: 'h3', text: '행사·이벤트 단기 운영' },
    { ul: true, items: ['기업 워크샵, 송년회, 창립기념일 행사', '브랜드 팝업스토어', '대학 축제, 지역 페스티벌'] },

    { h: 'h2', text: '렌탈·구매·임대 — 유연한 공급 방식' },
    { text: '피키픽포토부스는 고객의 운영 방식과 목적에 따라 다양한 공급 형태를 제공합니다.' },
    { ul: true, boldLabel: true, items: [
      '1. 기기 구매: 기기를 직접 소유하여 장기적으로 운영하고 싶은 사업체에 적합',
      '2. 장기 렌탈: 초기 비용 부담 없이 월 단위로 운영하는 방식',
      '3. 단기/시간제 렌탈: 팝업스토어, 1일 행사, 파티 등 단기 이벤트에 최적화 (월단위 / 연단위 렌탈 가능)',
    ] },
    { text: '기기 랩핑 커스텀: 브랜드 전용 외관 디자인 제작 (기기 모델, 공급 방식, 운영 기간에 따라 견적이 달라집니다. 정확한 안내는 아래 문의 채널을 통해 확인하세요.)' },
    { cap: '피키픽 포토부스대여-여의도 더현대 서울' },

    { h: 'h2', text: '자주 묻는 질문 (FAQ)' },
    { h: 'h3', text: 'Q. 설치에 필요한 최소 공간이 얼마나 되나요?' },
    { text: 'A. 약 1평(3.3㎡) 남짓의 공간이면 충분합니다. 테이블형 모델(레트로피키, 미니피키)의 경우 테이블 위 공간만 있으면 설치할 수 있어 더욱 유연하게 활용이 가능합니다.' },
    { h: 'h3', text: 'Q. 결제 시스템은 어떤 방식을 지원하나요?' },
    { text: 'A. 신용카드와 체크카드 결제를 모두 지원합니다. 행사나 프로모션 상황에 맞게 무료 모드와 유료 모드를 유연하게 전환하여 운영할 수 있습니다.' },
    { h: 'h3', text: 'Q. 기기 외관 커스텀이 가능한가요?' },
    { text: 'A. 네, 기기 랩핑 서비스를 통해 브랜드 로고, 컬러, 패턴 등을 기기 외관에 적용할 수 있습니다. 브랜드 팝업스토어나 호텔·백화점 등 브랜드 아이덴티티가 중요한 공간에 특히 추천합니다.' },
    { h: 'h3', text: 'Q. 운영 인력이 필요한가요?' },
    { text: 'A. 피키픽포토부스는 무인 키오스크 방식으로 운영되기 때문에 별도의 운영 인력이 필요하지 않습니다. 기기 설치 후 자동으로 운영되며, 원격으로 기기 상태를 확인할 수 있습니다.' },
    { h: 'h3', text: 'Q. 해외 수출도 가능한가요?' },
    { text: 'A. 이미 미국, 일본, 싱가포르, 대만, 홍콩, 캐나다, 프랑스, 룩셈부르크 등에 수출한 이력이 있습니다. 해외 수출 관련 문의도 환영합니다.' },
    { h: 'h3', text: 'Q. 어떤 모델이 저에게 맞는지 모르겠어요.' },
    { text: 'A. 설치 공간, 예상 하루 방문객 수, 운영 목적(수익 창출 / 행사 / 브랜딩 등)을 알려주시면 최적의 모델을 추천해 드립니다. 아래 문의 채널로 편하게 연락 주세요.' },

    { h: 'h2', text: '피키픽포토부스에 문의하세요' },
    { text: '포토부스 구매·렌탈·임대, 기기 커스텀, 해외 수출 등 모든 문의를 환영합니다. 설치 공간과 목적을 알려주시면 가장 적합한 솔루션을 안내해 드립니다.' },
    { h: 'h3', text: '📩 지금 바로 문의하기 →' },
    { text: 'http://pf.kakao.com/_qbEMb/chat', links: [{ find: 'http://pf.kakao.com/_qbEMb/chat', href: 'http://pf.kakao.com/_qbEMb/chat' }] },
    { text: '피키픽포토부스 공식 카카오톡을 통해 빠르게 답변드립니다.' },
    { cap: '피키픽포토부스 | PickyPic Photobooth | 포토부스대여 매매 운영 전문 브랜드 전국 200대+ 운영 | 8개국 수출 | 카페·호텔·팝업·기업행사 포토부스 렌탈·구매' },
  ], media),
};

POSTS.jeju = {
  match: '제주 애월',
  build: (media) => buildBody([
    { media: 0 },
    { text: '안녕하세요. 포토부스 대여 · 렌탈 전문 브랜드 피키픽 포토부스입니다 :)' },
    { text: '최근 포토부스대여는 브랜드 행사나 팝업스토어뿐만 아니라 카페, 음식점, 호텔, 복합문화공간 등 상시 운영 매장에서도 꾸준히 활용되는 콘텐츠로 자리잡고 있습니다.' },
    { text: '특히 제주도처럼 여행객 방문 비중이 높은 지역에서는 단순 포토존보다 직접 촬영하고 추억까지 남길 수 있는 체험형 콘텐츠 선호도가 더욱 높아지고 있는데요.' },
    { text: "이번에는 제주 애월에서 많은 사랑을 받고 있는 수제버거 맛집 ‘피즈 애월’ 매장에 설치된 피키픽 포토부스 실제 운영 사례를 소개드립니다." },
    { media: 1 }, { media: 2 }, { media: 3 }, { media: 4 }, { media: 5 }, { media: 6 },

    { cap: "제주 애월 핫플 ‘피즈 애월’에 설치된 피키픽 포토부스" },
    { h: 'h2', text: "제주 애월 '피즈버거' 포토부스 설치 사례" },
    { text: '제주 제주시 애월읍 애월로 29 1층에 위치한 피즈 애월은 제주 애월에서 인기 있는 수제버거 전문점입니다.' },
    { text: '아메리칸 버거, 피즈버거, 더블버거 등 다양한 버거 메뉴와 함께 미트칠리감자튀김, 땅콩쉐이크, 솔티드카라멜쉐이크 등 시그니처 메뉴들로도 많은 방문객들의 사랑을 받고 있는데요.' },
    { text: '특히 매장 내부는 넓고 깔끔한 분위기로 구성되어 있으며, 애월 바다를 함께 감상할 수 있는 좌석까지 마련되어 있어 제주 여행 중 방문하기 좋은 애월 핫플레이스로도 꾸준히 소개되고 있습니다.' },
    { text: "이처럼 감각적인 공간 분위기와 여행지 특유의 추억 요소가 중요한 공간인 만큼, 매장에서는 방문객들이 자연스럽게 경험을 남길 수 있도록 피키픽 포토부스 ‘모던피키(Modern Picky)’를 함께 운영하게 되었습니다." },
    { text: '최근 제주 카페 및 F&B 공간에서는 단순 포토존보다 실제 참여 가능한 콘텐츠 반응이 더욱 높아지고 있으며, 포토부스 설치 후 방문객 체류시간 증가와 자연스러운 SNS 업로드 효과까지 함께 기대할 수 있어 상시 운영 매장에서도 포토부스대여 문의가 꾸준히 증가하고 있습니다.' },

    { h: 'h2', text: "제주 포토부스대여로 설치된 ‘모던피키’" },
    { cap: "피키픽포토부스 '모던피키' 포토부스대여" },
    { text: "이번 제주 애월 피즈버거 매장에는 피키픽 포토부스의 원목 스탠드 타입 포토부스인 ‘모던피키(Modern Picky)’가 설치되었습니다.", bold: ['모던피키(Modern Picky)'] },
    { text: '모던피키는 미니멀한 디자인과 고급스러운 원형 우드 바디가 특징인 DSLR 포토부스로, 카페, 브랜드 공간, 팝업스토어, 호텔, 브랜드 매장처럼 인테리어 무드와 공간 조화가 중요한 장소에서 특히 선호도가 높은 기종입니다.' },
    { text: '제주 애월 피즈버거 매장 역시 감성적인 공간 분위기와 자연스럽게 어우러질 수 있도록 모던피키가 설치되었으며, 실제로 많은 방문객분들이 식사 전후로 자연스럽게 포토부스를 이용하며 제주 여행 추억을 사진으로 남기고 계십니다.' },
    { text: '특히 여행지 포토부스는 단순 촬영 콘텐츠를 넘어 SNS 업로드 커플 여행 사진 친구 여행 기록 가족 여행 추억 방문 인증 콘텐츠 등으로 자연스럽게 이어질 수 있어 만족도가 매우 높은 체험형 콘텐츠 중 하나입니다.' },

    { h: 'h2', text: '제주 애월 감성과 잘 어울리는 원목 포토부스' },
    { text: '최근 제주 카페 및 애월 핫플에서는 공간 분위기를 해치지 않는 감성적인 포토부스 선호도가 높아지고 있습니다.' },
    { text: '모던피키는 일반적인 행사형 포토부스 느낌보다 깔끔한 우드 디자인과 미니멀한 외형으로 제작되어 카페 및 F&B 공간 인테리어와도 자연스럽게 어우러지는 것이 특징입니다.' },
    { text: '특히 제주 애월 특유의 따뜻한 무드와도 잘 어울려 매장 포토존 역할까지 함께 하고 있습니다.' },
    { text: '여행 중 찍은 사진을 즉석에서 바로 인화해 가져갈 수 있다는 점 역시 방문객 만족도가 높은 이유 중 하나입니다.' },
    { text: '또한 포토부스 결과물을 SNS 스토리 및 피드에 업로드하는 방문객들도 많아, 매장 입장에서도 자연스러운 바이럴 콘텐츠 효과를 함께 기대할 수 있습니다.' },

    { h: 'h2', text: '모던피키 포토부스 스펙' },
    { cap: '피키픽 포토부스 모던피키' },
    { ul: true, items: ['DSLR 카메라 촬영', '13인치 모니터', '원형 우드 바디 디자인', '4×6 / 2×4 인화 지원', '카드 / 코인 / 쿠폰 / 무료촬영 운영 가능', 'UI 및 포토프레임 커스터마이징 가능', '외부 랩핑 브랜딩 가능'] },
    { text: '특히 모던피키는 브랜드 공간 및 상시 운영 매장에서도 안정적으로 사용할 수 있도록 제작되어, 카페 포토부스, 브랜드 매장 포토부스, 호텔 포토부스, 팝업스토어 포토부스 등 다양한 공간에서 꾸준히 설치 문의가 이어지고 있습니다.' },

    { h: 'h2', text: '제주도 포토부스대여, 왜 반응이 좋을까?' },
    { cap: '애월 피즈버거 프레임' },
    { text: "최근 제주도에서는 단순 관광보다 ‘기록형 여행 콘텐츠’를 중요하게 생각하는 여행객이 많아지면서 포토부스 설치에 대한 선호도 역시 빠르게 높아지고 있습니다." },
    { text: '특히 포토부스는' },
    { ul: true, items: ['여행 추억 기록', '자연스러운 SNS 업로드 유도', '공간 체류시간 증가', '방문 인증 콘텐츠 제작', '브랜드 경험 강화', '감성 포토존 역할'] },
    { text: '등 다양한 효과를 함께 만들 수 있어 제주 카페, 애월 핫플, 브랜드 매장, F&B 공간에서도 활용도가 매우 높은 콘텐츠로 자리잡고 있습니다.' },
    { text: '특히 DSLR 포토부스는 일반 셀프촬영보다 높은 퀄리티의 결과물을 제공하기 때문에 브랜드 공간 및 감성 매장에서도 선호도가 더욱 높아지고 있습니다.' },

    { cap: '제주 애월 피즈버거 전경' },
    { text: "현재 피즈 애월 매장에는 피키픽 포토부스 ‘모던피키’가 상시 설치되어 있습니다!" },
    { text: '제주 애월 여행 중 맛있는 수제버거와 함께 특별한 추억까지 남기고 싶다면, 피즈 애월에서 피키픽 포토부스도 직접 경험해보세요.' },
    { text: '감성적인 공간과 제주 바다 분위기 속에서 더 특별한 여행 사진을 남길 수 있습니다 :)' },
    { text: '피키픽 포토부스는 카페, 브랜드 매장, 팝업스토어, 호텔, F&B 공간 등 공간 무드에 맞춘 커스터마이징 포토부스대여/렌탈/매매를 진행하고 있습니다.' },
    { text: '포토부스 설치 및 브랜드 공간 포토부스 운영이 필요하시다면 피키픽 포토부스로 문의주세요 :)' },

    { h: 'h2', text: '📩 포토부스 견적 및 상세 문의' },
    { h: 'h3', text: '[피키픽 공식 홈페이지]' },
    { text: 'https://picky-pic.com/rental', links: [{ find: 'https://picky-pic.com/rental', href: 'https://picky-pic.com/rental' }] },
    { h: 'h3', text: '[피키픽 카카오톡 채널]' },
    { text: 'https://pf.kakao.com/_qbEMb', links: [{ find: 'https://pf.kakao.com/_qbEMb', href: 'https://pf.kakao.com/_qbEMb' }] },
    { h: 'h3', text: '[피키픽 포토부스 공식 인스타그램 채널]' },
    { text: 'https://www.instagram.com/pickypic.official/', links: [{ find: 'https://www.instagram.com/pickypic.official/', href: 'https://www.instagram.com/pickypic.official/' }] },
    { h: 'h3', text: '이전글' },
    { text: 'https://blog.naver.com/pickypicphotobooth/224277550004', links: [{ find: 'https://blog.naver.com/pickypicphotobooth/224277550004', href: 'https://blog.naver.com/pickypicphotobooth/224277550004' }] },
    { text: 'https://blog.naver.com/pickypicphotobooth/224282933955', links: [{ find: 'https://blog.naver.com/pickypicphotobooth/224282933955', href: 'https://blog.naver.com/pickypicphotobooth/224282933955' }] },
  ], media),
};

POSTS.seongsu = {
  match: '2026 성수',
  build: (media) => buildBody([
    { media: 0 },
    { text: '안녕하세요. 포토부스대여 · 렌탈 전문 브랜드 피키픽 포토부스입니다 :)' },
    { text: '최근 성수 팝업스토어 및 브랜드 행사에서는 단순 전시형 콘텐츠보다 방문객이 직접 참여할 수 있는 체험형 콘텐츠 운영 비중이 빠르게 높아지고 있습니다. 특히 브랜드 경험과 SNS 바이럴이 중요한 행사에서는 현장 참여와 자연스러운 콘텐츠 확산까지 동시에 가능한 포토부스대여 문의가 꾸준히 증가하고 있는데요.' },
    { text: "이번에는 서울 성수동에서 새롭게 오픈한 케이스위스(K-SWISS) 플래그십스토어 ‘THE HOUSE OF COURT’ 행사에 운영된 피키픽 포토부스 실제 설치 사례를 소개드립니다." },
    { cap: '성수 팝업스토어 포토부스대여로 운영된 케이스위스 플래그십스토어' },
    { text: 'https://naver.me/G1pFRV8O', links: [{ find: 'https://naver.me/G1pFRV8O', href: 'https://naver.me/G1pFRV8O' }] },
    { media: 1 },
    { text: '서울 성동구 연무장길 93 1층에 새롭게 오픈한 케이스위스 성수 플래그십스토어는 브랜드 창립 60주년 리브랜딩 프로젝트와 함께 공개된 공간입니다.', bold: ['브랜드 창립 60주년 리브랜딩 프로젝트'] },
    { text: '글로벌 프리미엄 스포츠 브랜드 케이스위스(K-SWISS)는 이번 성수 플래그십스토어를 통해 브랜드의 새로운 방향성과 클래식한 무드를 함께 선보였으며, 오픈 행사에는 아이브 리즈, 더보이즈 현재 등 셀럽들도 직접 방문하며 많은 화제를 모았습니다.' },
    { text: '특히 성수 팝업스토어 특성상 방문객 체류시간과 SNS 업로드 유도가 매우 중요한 만큼, 현장에서는 브랜드 경험 자체를 콘텐츠로 남길 수 있는 포토부스대여 이벤트가 핵심 체험 콘텐츠로 운영되었습니다.' },

    { h: 'h2', text: "브랜드 행사 포토부스대여로 설치된 ‘클래식피키’" },
    { media: 2 },
    { text: "이번 브랜드 행사 포토부스대여에는 피키픽 포토부스의 대표 라인업인 ‘클래식피키(Classic Picky)’가 설치되었습니다. 클래식피키는 원목 감성 디자인과 DSLR 고화질 촬영이 가능한 프리미엄 포토부스로, 성수 팝업스토어, 브랜드 행사, 플래그십스토어, 패션 팝업처럼 브랜드 무드와 공간 디자인이 중요한 행사에서 특히 선호도가 높은 기종입니다.", bold: ['클래식피키(Classic Picky)'] },
    { text: '이번 행사에서는 현장 방문객 누구나 자유롭게 참여할 수 있도록 쿠폰형 이벤트 방식으로 운영되었으며, 이벤트 참여 후 직접 촬영한 사진을 즉석에서 출력해 가져갈 수 있도록 구성되었습니다.' },
    { text: '실제로 행사 운영 중에는 포토부스 촬영 대기줄이 꾸준히 이어졌고, 방문객들이 촬영한 사진을 인스타그램 스토리 및 SNS에 자연스럽게 업로드하면서 브랜드 바이럴 효과까지 함께 만들어졌습니다.' },
    { text: '단순 체험형 이벤트가 아니라 브랜드 경험 자체를 콘텐츠화할 수 있었다는 점에서 현장 만족도 또한 매우 높았습니다.' },

    { h: 'h2', text: '신문지 포토부스 컨셉으로 운영된 브랜드 팝업 행사' },
    { media: 3 },
    { text: "이번 성수 팝업스토어 포토부스대여에서는 최근 브랜드 행사에서 반응이 좋은 ‘신문지 포토부스’ 컨셉으로 운영이 진행되었습니다. 신문 레이아웃 느낌의 포토프레임과 빈티지 무드 디자인을 적용해, 케이스위스 특유의 클래식한 브랜드 감성과 플래그십스토어 공간 분위기가 자연스럽게 연결될 수 있도록 구성했습니다." },
    { text: '특히 성수 브랜드 행사 및 패션 팝업스토어에서는 SNS 업로드 시 비주얼 완성도가 매우 중요한 만큼, 일반적인 포토부스보다 브랜드 컨셉이 반영된 커스텀 포토부스대여 선호도가 더욱 높아지고 있습니다. 최근에는 단순 포토존보다 브랜드 체험형 콘텐츠와 연계된 포토부스 이벤트 운영 문의도 꾸준히 증가하는 추세입니다.' },

    { cap: '아이브 리즈도 직접 촬영한 포토부스' },
    { media: 4 }, { media: 5 },
    { cap: '출처 : 아이브리즈 인스타그램 (@liz.yeyo)' },
    { text: 'https://www.instagram.com/p/DYEOkfggahO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==', links: [{ find: 'https://www.instagram.com/p/DYEOkfggahO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==', href: 'https://www.instagram.com/p/DYEOkfggahO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==' }] },
    { text: '이번 행사에 참여한 아이브 리즈 역시 현장에 설치된 피키픽 포토부스를 통해 직접 사진을 촬영했으며, SNS와 인스타그램 업로드까지 이어지면서 현장 방문객들의 관심도 더욱 높아졌습니다.' },
    { text: '특히 연예인 및 인플루언서 방문이 많은 성수 팝업스토어 행사에서는 자연스럽게 SNS 콘텐츠까지 연결될 수 있는 포토부스대여 콘텐츠의 중요성이 더욱 커지고 있습니다.' },
    { text: '브랜드 행사에서 포토부스를 많이 사용하는 이유 역시 단순 이벤트를 넘어 현장 경험 자체를 바이럴 콘텐츠로 확장할 수 있기 때문입니다.' },

    { h: 'h2', text: '클래식피키 포토부스 스펙' },
    { media: 6 },
    { cap: '피키픽포토부스 클래식 피키 포토부스대여' },
    { text: 'DSLR 카메라 촬영 - 13인치 모니터' },
    { text: '특히 브랜드 행사 포토부스대여에서는 단순 출력 퀄리티보다도 현장 분위기에 자연스럽게 녹아드는 디자인과 안정적인 현장 운영 경험이 매우 중요합니다. 피키픽 포토부스는 다양한 브랜드 행사 및 팝업스토어 운영 경험을 기반으로 행사 규모와 브랜드 무드에 맞춘 맞춤형 포토부스 렌탈 및 운영이 가능합니다.' },

    { h: 'h2', text: '성수 팝업스토어에서 포토부스대여를 많이 사용하는 이유' },
    { text: 'https://blog.naver.com/pickypicphotobooth/224269408626', links: [{ find: 'https://blog.naver.com/pickypicphotobooth/224269408626', href: 'https://blog.naver.com/pickypicphotobooth/224269408626' }] },
    { text: 'https://blog.naver.com/pickypicphotobooth/224231256906', links: [{ find: 'https://blog.naver.com/pickypicphotobooth/224231256906', href: 'https://blog.naver.com/pickypicphotobooth/224231256906' }] },
    { text: '최근 성수 팝업스토어 및 브랜드 행사에서는 단순 전시형 공간보다 직접 참여 가능한 체험형 콘텐츠 선호도가 높아지고 있습니다. 그중에서도 포토부스대여는 등 다양한 효과를 동시에 만들 수 있어 브랜드 행사 필수 콘텐츠처럼 활용되고 있습니다.' },
    { text: '특히 DSLR 포토부스는 일반 셀프촬영보다 높은 퀄리티의 결과물을 제공하기 때문에 패션 브랜드 팝업스토어 및 플래그십스토어에서 선호도가 더욱 높아지고 있습니다.' },

    { h: 'h2', text: '성수 팝업스토어 · 브랜드 행사 포토부스대여 문의' },
    { text: '피키픽 포토부스는 브랜드 팝업스토어, 플래그십스토어, 패션 행사, 전시, 대학축제, 기업행사 등 다양한 행사에 맞춰 커스터마이징 포토부스대여를 진행하고 있습니다.' },
    { text: '브랜드 무드에 맞는 포토부스 렌탈이 필요하시다면 피키픽 포토부스로 문의주세요 :) 감성적인 디자인과 안정적인 현장 운영 경험으로 브랜드 경험을 더욱 특별하게 만들어드립니다.' },

    { h: 'h2', text: '📩 포토부스 견적 및 상세 문의' },
    { h: 'h3', text: '[피키픽 공식 홈페이지]' },
    { text: 'https://picky-pic.com/rental', links: [{ find: 'https://picky-pic.com/rental', href: 'https://picky-pic.com/rental' }] },
    { h: 'h3', text: '[피키픽 카카오톡 채널]' },
    { text: 'https://pf.kakao.com/_qbEMb', links: [{ find: 'https://pf.kakao.com/_qbEMb', href: 'https://pf.kakao.com/_qbEMb' }] },
    { h: 'h3', text: '[피키픽 포토부스 공식 인스타그램 채널]' },
    { text: 'https://www.instagram.com/pickypic.official/', links: [{ find: 'https://www.instagram.com/pickypic.official/', href: 'https://www.instagram.com/pickypic.official/' }] },
  ], media),
};

// Auto-format disabled: heuristic mis-detects headings on soft-wrapped posts and
// cannot separate glued words without editing text. Held pending user decision.
// POSTS.seongsu  = { match: '성수',    auto: true };
// POSTS.jeju     = { match: '제주 애월', auto: true };
// POSTS.brand    = { match: 'pickypic-photobooth-rental-purchase', auto: true };
// POSTS.carevent = { match: '자동차', titleEmpty: true, auto: true };

// ── Runner ──────────────────────────────────────────────────────────────
const q = `*[_type=="blogPost"]{ _id, title, "slug":slug.current, body }`;
const url = `https://7b9lcco4.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(q)}`;
const all = (await (await fetch(url)).json()).result;

const bodyPlain = (b) => (b || []).filter(x => x._type === 'block').map(x => (x.children || []).map(c => c.text || '').join('')).join(' ');
for (const [name, def] of Object.entries(POSTS)) {
  if (ONLY && ONLY !== name) continue;
  if (def.done && ONLY !== name) { console.log(`\n[${name}] 이미 완료됨 — 건너뜀`); continue; }
  let post = all.find(p => (p.title || '').includes(def.match) || (p.slug || '').includes(def.match));
  if (!post && def.titleEmpty) post = all.find(p => !(p.title || '').trim() && bodyPlain(p.body).includes('자동차 브랜드 행사'));
  if (!post) { console.log(`\n[${name}] 글을 찾지 못함 (match=${def.match})`); continue; }
  const media = (post.body || []).filter(b => b._type === 'image' || b._type === 'collage');
  const lines = reconstructLines(post.body);
  const newBody = def.auto ? buildBody(autoDirectives(lines, media), media) : def.build(media);

  const oldC = chars(bodyText(post.body || []));
  const newC = chars(bodyText(newBody));
  const equal = oldC === newC;

  console.log(`\n═══ [${name}] ${post.title} ═══`);
  console.log(`  블록: ${(post.body||[]).length} → ${newBody.length} | 이미지 보존: ${media.length}`);
  console.log(`  글자(공백제외): 원본 ${oldC.length} / 신규 ${newC.length} | 일치: ${equal ? '✅' : '❌ 불일치!'}`);
  if (!equal) {
    let i = 0; while (i < oldC.length && i < newC.length && oldC[i] === newC[i]) i++;
    console.log(`  첫 불일치 @${i}: 원본[...${oldC.slice(Math.max(0,i-12),i+12)}...] vs 신규[...${newC.slice(Math.max(0,i-12),i+12)}...]`);
    console.log('  → 이 글은 건너뜁니다 (내용 보호).');
    continue;
  }
  const heads = newBody.filter(b => b.style === 'h2' || b.style === 'h3').map(b => `${b.style}: ${(b.children||[]).map(c=>c.text).join('')}`);
  const nBullets = newBody.filter(b => b.listItem === 'bullet').length;
  const nLinks = newBody.reduce((a,b)=>a+((b.markDefs||[]).filter(d=>d._type==='link').length),0);
  console.log(`  소제목 ${heads.length} · 불릿 ${nBullets} · 링크 ${nLinks}`);
  if (SHOWH) heads.forEach(h => console.log('    · ' + h));
  if (APPLY) {
    await client.patch(post._id).set({ body: newBody }).commit();
    console.log('  ✅ Sanity 반영 완료');
  } else {
    console.log('  (dry-run — 변경 안 함. --apply 로 반영)');
  }
}
console.log('\n완료.');
