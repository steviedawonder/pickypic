// AI 스타일 갤러리 샘플 이미지 일괄 생성
//
// styles.json 의 스타일마다, subjects.json 에 정한 가상 모델의 기준 사진 여러 장을 함께 넣어
// Gemini 이미지 모델로 결과를 만들고 out/<id>.png 와 생성 기록 out/<id>.json 을 저장한다.
// 이미 결과가 있으면 건너뛰므로 중간에 멈춰도 다시 실행하면 이어서 만든다.
// 검수를 통과한 결과만 어드민 > AI 스타일 에서 올린다.
//
// 사용법 (이 폴더에서):
//   npm install
//   node --env-file=.env generate.mjs --dry-run        # 무엇을 만들지만 확인 (API 호출 없음)
//   node --env-file=.env generate.mjs                  # 전체
//   node --env-file=.env generate.mjs job-pilot pet-cat           # 특정 id만
//   node --env-file=.env generate.mjs --category=season --limit=3  # 카테고리·개수 제한
//   node --env-file=.env generate.mjs job-pilot --force            # 있어도 다시 생성
//
// .env (커밋하지 않음):
//   GEMINI_API_KEY=...
//   GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview   # 부스와 같은 모델
//   MODELS_DIR=C:/.../pickypic-virtual-models       # 가상 모델 압축을 푼 폴더
//   IMAGE_SIZE=1K                                   # 선택: 1K / 2K / 4K

import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const onlyIds = new Set(args.filter((a) => !a.startsWith('--')));
const dryRun = flag('dry-run');
const force = flag('force');
const category = option('category');
const limit = Number(option('limit')) || Infinity;

const { GEMINI_API_KEY, GEMINI_IMAGE_MODEL, MODELS_DIR, IMAGE_SIZE = '1K' } = process.env;
if (!MODELS_DIR) fail('MODELS_DIR 에 가상 모델 압축을 푼 폴더를 넣어 주세요.');
if (!dryRun && (!GEMINI_API_KEY || !GEMINI_IMAGE_MODEL)) fail('GEMINI_API_KEY 와 GEMINI_IMAGE_MODEL 을 .env 에 넣어 주세요.');

// Appended to every prompt: the gallery promises the booth keeps faces as they are.
const TAIL =
  "Keep every person's face, identity, age and the number of people exactly as in the reference images. " +
  'No text, letters, logos or watermarks unless the style asks for them.';
const ASPECT = '2:3'; // gallery cards are 2:3
const MAX_TRIES = 3;
const PAUSE_MS = 4000; // between requests, to stay under rate limits

const subjects = JSON.parse(await fs.readFile('subjects.json', 'utf8'));
const styles = JSON.parse(await fs.readFile('styles.json', 'utf8'));

// ── Validate the whole list before spending anything ──
const problems = [];
const seen = new Set();
for (const s of styles) {
  const subject = subjects[s.subject];
  if (seen.has(s.id)) problems.push(`${s.id}: id 중복`);
  seen.add(s.id);
  if (!subject) { problems.push(`${s.id}: subjects.json 에 없는 인물 "${s.subject}"`); continue; }
  // The family set includes children; the model sheet limits them to family-friendly scenes.
  if (subject.minors && !subject.allowedCategories.includes(s.category)) {
    problems.push(`${s.id}: 아이가 포함된 ${s.subject} 는 "${s.category}" 카테고리에 쓸 수 없음`);
  }
  for (const ref of subject.refs) {
    const p = path.join(MODELS_DIR, ref);
    if (!(await exists(p))) problems.push(`${s.id}: 기준 사진 없음 ${p}`);
  }
  if (!s.prompt || !s.name?.ko) problems.push(`${s.id}: prompt 또는 name.ko 없음`);
}
if (problems.length) fail(`styles.json / subjects.json 확인 필요:\n  ${problems.join('\n  ')}`);

const queue = [];
for (const s of styles) {
  if (onlyIds.size && !onlyIds.has(s.id)) continue;
  if (category && s.category !== category) continue;
  if (!force && (await exists(outPath(s.id)))) continue;
  queue.push(s);
}
const todo = queue.slice(0, limit);

console.log(`모델 ${GEMINI_IMAGE_MODEL || '(미설정)'} · 비율 ${ASPECT} · 크기 ${IMAGE_SIZE}`);
console.log(`만들 것 ${todo.length}개${queue.length > todo.length ? ` (전체 대기 ${queue.length}개 중)` : ''}\n`);
if (dryRun) {
  for (const s of todo) {
    const subject = subjects[s.subject];
    console.log(`- ${s.id}  [${s.category}] ${s.name.ko}  ← ${s.subject} (기준 사진 ${subject.refs.length}장)`);
  }
  console.log('\n--dry-run: API 를 호출하지 않았습니다. 실패 시 재시도까지 최대 ' + todo.length * MAX_TRIES + '회 호출될 수 있습니다.');
  process.exit(0);
}

const { GoogleGenAI } = await import('@google/genai');
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
await fs.mkdir('out', { recursive: true });

let made = 0;
const failed = [];
for (const [i, s] of todo.entries()) {
  const subject = subjects[s.subject];
  const refParts = await Promise.all(subject.refs.map(async (ref) => ({
    inlineData: { mimeType: mimeOf(ref), data: (await fs.readFile(path.join(MODELS_DIR, ref))).toString('base64') },
  })));
  const prompt = `${subject.head}\n\n${s.prompt}\n\n${TAIL}`;

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const started = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: [{ role: 'user', parts: [...refParts, { text: prompt }] }],
        config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ASPECT, imageSize: IMAGE_SIZE } },
      });
      const img = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!img) throw new Error(`이미지 없음 (finishReason: ${res.candidates?.[0]?.finishReason ?? '알 수 없음'})`);
      await fs.writeFile(outPath(s.id), Buffer.from(img.inlineData.data, 'base64'));
      // What made this image, so a good result can be reproduced or a bad one traced
      await fs.writeFile(path.join('out', `${s.id}.json`), JSON.stringify({
        id: s.id, category: s.category, subject: s.subject, name: s.name, desc: s.desc,
        model: GEMINI_IMAGE_MODEL, aspectRatio: ASPECT, imageSize: IMAGE_SIZE,
        refs: subject.refs, prompt, createdAt: new Date().toISOString(),
      }, null, 2));
      console.log(`[${i + 1}/${todo.length}] OK  ${s.id}  ${s.name.ko}  ${((Date.now() - started) / 1000).toFixed(1)}s`);
      made++;
      break;
    } catch (e) {
      console.warn(`[${i + 1}/${todo.length}] 재시도 ${attempt}/${MAX_TRIES}  ${s.id}: ${String(e.message).slice(0, 200)}`);
      if (attempt === MAX_TRIES) failed.push(s.id);
      else await sleep(PAUSE_MS * attempt);
    }
  }
  if (i < todo.length - 1) await sleep(PAUSE_MS);
}

console.log(`\n완료: 새로 ${made}개, 실패 ${failed.length}개${failed.length ? ` → 다시: node --env-file=.env generate.mjs ${failed.join(' ')}` : ''}`);

function outPath(id) { return path.join('out', `${id}.png`); }
function mimeOf(file) { return /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg'; }
function exists(p) { return fs.stat(p).then(() => true, () => false); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fail(msg) { console.error(msg); process.exit(1); }
