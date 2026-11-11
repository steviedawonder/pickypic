// AI 스타일 갤러리 샘플 이미지 일괄 생성
//
// styles.json 의 각 스타일마다 base/ 의 기준 인물 사진을 Gemini 이미지 모델로 바꿔
// out/<id>.png 로 저장한다. 이미 있는 결과는 건너뛰므로 중간에 멈춰도 다시 실행하면 된다.
// 검수를 통과한 결과만 어드민 > AI 스타일 에서 올린다.
//
// 사용법 (이 폴더에서):
//   npm install
//   node --env-file=.env generate.mjs            # 전체
//   node --env-file=.env generate.mjs job-pilot  # 특정 id만
//
// .env (커밋하지 않음):
//   GEMINI_API_KEY=...
//   GEMINI_IMAGE_MODEL=...   # 부스와 같은 모델 이름을 그대로

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';

const { GEMINI_API_KEY, GEMINI_IMAGE_MODEL } = process.env;
if (!GEMINI_API_KEY || !GEMINI_IMAGE_MODEL) {
  console.error('GEMINI_API_KEY 와 GEMINI_IMAGE_MODEL 을 .env 에 넣어 주세요.');
  process.exit(1);
}

// Appended to every prompt: the gallery promises the booth keeps faces as they are.
const KEEP_FACES =
  "Keep every person's face, identity, age and the number of people exactly the same as in the photo. " +
  'Do not add text, logos or watermarks unless the style asks for them. Vertical 2:3 portrait.';

const MAX_TRIES = 3;
const PAUSE_MS = 4000; // between requests, to stay under rate limits

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const only = new Set(process.argv.slice(2));
const styles = JSON.parse(await fs.readFile('styles.json', 'utf8'));
await fs.mkdir('out', { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mimeOf = (file) => (/\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg');
const exists = (p) => fs.stat(p).then(() => true, () => false);

let made = 0, skipped = 0, failed = [];
for (const s of styles) {
  if (only.size && !only.has(s.id)) continue;
  const out = path.join('out', `${s.id}.png`);
  if (await exists(out)) { skipped++; continue; }

  const basePath = path.join('base', s.base);
  if (!(await exists(basePath))) { console.warn(`기준 사진 없음: ${basePath} (${s.id})`); failed.push(s.id); continue; }
  const base = await fs.readFile(basePath);

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeOf(s.base), data: base.toString('base64') } },
            { text: `${s.prompt}\n\n${KEEP_FACES}` },
          ],
        }],
      });
      const img = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!img) throw new Error(`이미지 없음 (finishReason: ${res.candidates?.[0]?.finishReason ?? '알 수 없음'})`);
      await fs.writeFile(out, Buffer.from(img.inlineData.data, 'base64'));
      console.log(`OK  ${s.id}  ${s.name}`);
      made++;
      break;
    } catch (e) {
      console.warn(`재시도 ${attempt}/${MAX_TRIES}  ${s.id}: ${e.message}`);
      if (attempt === MAX_TRIES) failed.push(s.id);
      else await sleep(PAUSE_MS * attempt);
    }
  }
  await sleep(PAUSE_MS);
}

console.log(`\n완료: 새로 ${made}개, 건너뜀 ${skipped}개, 실패 ${failed.length}개${failed.length ? ` (${failed.join(', ')})` : ''}`);
