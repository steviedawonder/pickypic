// 생성한 샘플(out/)과 사이트 기본 견본 12종을 갤러리(Sanity aiStyle)에 등록
//
// 어드민 › AI 스타일 에 하나씩 올리는 것과 같은 결과를 한 번에 만든다.
// 문서 id 를 aiStyle-<스타일 id> 로 고정해 두어서, 다시 실행하면 새로 만들지 않고 덮어쓴다.
// 이미지는 jpg 로 줄여 올리고(Sanity 는 같은 파일을 한 번만 저장), 어드민에서 바꾼
// 정렬 순서·노출 여부는 다시 실행해도 건드리지 않는다.
//
// 사용법 (이 폴더에서, 사이트 루트에서 npm install 이 되어 있어야 함):
//   node --env-file=.env upload.mjs --dry-run              # 무엇을 올릴지만 확인
//   node --env-file=.env upload.mjs                        # out/ 의 결과 전부 + 기본 견본 12종
//   node --env-file=.env upload.mjs job-pilot pet-cat      # 특정 id만
//   node --env-file=.env upload.mjs --skip=cine-noir,kpop-album   # 검수에서 떨어진 것 빼기
//   node --env-file=.env upload.mjs --no-samples           # 기본 견본 12종은 빼기
//
// .env: SANITY_API_TOKEN (Vercel 의 쓰기 토큰과 같은 값)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import sharp from 'sharp';
import { aiStyleCategories, fallbackAiStyles } from '../../src/data/aiStyles.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '../../public');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const withSamples = !args.includes('--no-samples');
const skip = new Set((args.find((a) => a.startsWith('--skip='))?.split('=')[1] || '').split(',').filter(Boolean));
const onlyIds = new Set(args.filter((a) => !a.startsWith('--')));

const { SANITY_API_TOKEN } = process.env;
if (!dryRun && !SANITY_API_TOKEN) {
  console.error('SANITY_API_TOKEN 을 .env 에 넣어 주세요 (Vercel 의 쓰기 토큰).');
  process.exit(1);
}

const categoryIds = new Set(aiStyleCategories.map((c) => c.id));
const styles = JSON.parse(await fs.readFile(path.join(here, 'styles.json'), 'utf8'));

// ── Collect what to upload ──
const items = [];
for (const [i, s] of styles.entries()) {
  const file = path.join(here, 'out', `${s.id}.png`);
  if (!(await exists(file))) continue;
  items.push({
    id: s.id, name: s.name, desc: s.desc, category: s.category,
    people: s.subject === 'COUPLE' ? 'duo' : s.subject === 'FAM01' ? 'group' : 'solo',
    image: file, order: s.order ?? (i + 1) * 10, isNew: true,
  });
}
if (withSamples) {
  // The twelve samples already on /ai-photobooth, after the new styles
  for (const [i, s] of fallbackAiStyles.entries()) {
    items.push({
      id: s.id, name: s.name, desc: s.desc, category: s.category, people: s.people || 'solo',
      image: path.join(publicDir, s.image), before: s.before ? path.join(publicDir, s.before) : undefined,
      order: 1000 + (i + 1) * 10, isNew: false,
    });
  }
}
const todo = items.filter((it) => (!onlyIds.size || onlyIds.has(it.id)) && !skip.has(it.id));

const problems = [];
for (const it of todo) {
  if (!categoryIds.has(it.category)) problems.push(`${it.id}: 사이트에 없는 카테고리 "${it.category}"`);
  if (!it.name?.ko) problems.push(`${it.id}: 한국어 이름 없음`);
  for (const f of [it.image, it.before].filter(Boolean)) if (!(await exists(f))) problems.push(`${it.id}: 파일 없음 ${f}`);
}
if (problems.length) {
  console.error(`확인 필요:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

console.log(`등록할 스타일 ${todo.length}개 (새 샘플 ${todo.filter((t) => t.isNew).length} + 기본 견본 ${todo.filter((t) => !t.isNew).length})\n`);
if (dryRun) {
  for (const it of todo) console.log(`- aiStyle-${it.id}  [${it.category}] ${it.name.ko}${it.before ? ' (원본 있음)' : ''}`);
  console.log('\n--dry-run: Sanity 에 아무것도 쓰지 않았습니다.');
  process.exit(0);
}

const client = createClient({
  projectId: '7b9lcco4', dataset: 'production', apiVersion: '2024-01-01', token: SANITY_API_TOKEN, useCdn: false,
});

const uploadImage = async (file, id, label) => {
  const jpg = await sharp(file).flatten({ background: '#ffffff' }).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const asset = await client.assets.upload('image', jpg, { filename: `${id}-${label}.jpg` });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
};

let done = 0;
const failed = [];
for (const [i, it] of todo.entries()) {
  const _id = `aiStyle-${it.id}`;
  try {
    const content = {
      nameKo: it.name.ko, nameEn: it.name.en, nameJp: it.name.jp,
      descKo: it.desc?.ko, descEn: it.desc?.en, descJp: it.desc?.jp,
      category: it.category, people: it.people,
      image: await uploadImage(it.image, it.id, 'result'),
      ...(it.before ? { beforeImage: await uploadImage(it.before, it.id, 'original') } : {}),
    };
    // Order, visibility and NEW are set once; later runs keep what staff changed in the admin.
    await client.transaction()
      .createIfNotExists({ _id, _type: 'aiStyle', order: it.order, isActive: true, isNew: it.isNew, nameKo: it.name.ko, category: it.category })
      .patch(_id, (p) => p.set(content))
      .commit();
    console.log(`[${i + 1}/${todo.length}] OK  ${_id}  ${it.name.ko}`);
    done++;
  } catch (e) {
    console.warn(`[${i + 1}/${todo.length}] 실패  ${_id}: ${String(e.message).slice(0, 200)}`);
    failed.push(it.id);
  }
}

console.log(`\n완료: ${done}개 등록${failed.length ? `, 실패 ${failed.length}개 → 다시: node --env-file=.env upload.mjs ${failed.join(' ')}` : ''}`);
console.log('사이트에 반영하려면 재빌드가 필요합니다 (어드민에서 아무 스타일이나 저장하거나, Vercel 에서 재배포).');

function exists(p) { return fs.stat(p).then(() => true, () => false); }
