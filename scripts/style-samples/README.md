# AI 스타일 갤러리 샘플 만들기

`/ai-photobooth/gallery`에 올릴 스타일 샘플을 가상 모델 사진으로 일괄 생성합니다. 사이트 빌드와는 별개 도구입니다.

## 파일

| 파일 | 내용 |
|---|---|
| `styles.json` | 스타일 목록. 스타일마다 id, 카테고리, 쓸 인물, 이름·한 줄 설명(ko/en/jp), 프롬프트 |
| `subjects.json` | 인물 설정. 기준 사진(여러 장)과 얼굴을 고정하는 문장 |
| `generate.mjs` | 일괄 생성 스크립트 |
| `out/` | 결과(`<id>.png`)와 생성 기록(`<id>.json`). 저장소에 올리지 않음 |

인물: `M01`(남자 23살), `F01`(여자 23살), `COUPLE`(M01+F01), `FAM01`(30대 부부 + 6살 아들 + 4살 딸).
카테고리 id는 사이트의 `src/data/aiStyles.ts`와 같습니다.

## 준비 (처음 한 번)

1. 가상 모델 압축 파일(`pickypic-virtual-models-*.zip`)을 저장소 **밖** 아무 폴더에 풉니다.
2. 이 폴더에서 `npm install`
3. 이 폴더에 `.env` 파일을 만듭니다(커밋되지 않음).
   ```
   GEMINI_API_KEY=발급받은키
   GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
   MODELS_DIR=C:/압축을/푼/폴더/pickypic-virtual-models
   ```

## 실행

```
node --env-file=.env generate.mjs --dry-run                 # 무엇을 만들지 확인 (비용 없음)
node --env-file=.env generate.mjs --category=job --limit=2  # 먼저 몇 장만 시험
node --env-file=.env generate.mjs                           # 전체 (이미 만든 것은 건너뜀)
node --env-file=.env generate.mjs pet-cat --force           # 마음에 안 드는 것만 다시
```

- 실행 전에 목록 전체를 검사합니다. id 중복, 없는 인물, 없는 기준 사진, **아이가 포함된 FAM01을 허용되지 않은 카테고리에 쓴 경우**가 하나라도 있으면 아무것도 생성하지 않고 멈춥니다.
- 실패한 스타일은 마지막에 다시 실행할 명령을 알려 줍니다.
- 스타일을 늘릴 때는 `styles.json`에 항목을 추가합니다. 실존 인물·연예인·실제 브랜드 로고는 프롬프트에 넣지 않습니다.

## 갤러리에 등록

검수를 통과한 결과를 어드민(Sanity `aiStyle`)에 한 번에 올립니다. 사이트 루트에서 `npm install`이 되어 있어야 하고, `.env`에 `SANITY_API_TOKEN`(Vercel의 쓰기 토큰)이 필요합니다.

```
node --env-file=.env upload.mjs --dry-run                   # 무엇을 올릴지 확인
node --env-file=.env upload.mjs --skip=cine-noir,pet-cat    # 검수에서 떨어진 것만 빼고 등록
```

- `out/`의 결과 전부와 사이트 기본 견본 12종(원본 사진 포함)을 올립니다. 견본을 빼려면 `--no-samples`.
- 문서 id가 `aiStyle-<스타일 id>`로 고정이라 다시 실행하면 덮어씁니다. 어드민에서 바꾼 정렬 순서·노출·NEW는 유지됩니다.
- 올린 뒤 사이트에 보이려면 재빌드가 필요합니다(어드민에서 아무 스타일이나 저장하거나 Vercel 재배포).

## 검수 기준

- 얼굴이 기준 사진과 같은 사람인지(특히 COUPLE·FAM01은 모든 사람)
- 손가락·팔 개수, 아이들 얼굴이 자연스러운지
- 글자·로고·워터마크가 생기지 않았는지
- 통과한 것만 어드민 › AI 스타일에 올리고, 이름·설명은 `out/<id>.json`의 값을 그대로 씁니다. 갤러리에는 «AI로 만든 가상 인물» 안내가 이미 있습니다.
