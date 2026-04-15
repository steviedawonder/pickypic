import { defineType, defineField } from 'sanity';
import { BlogPostInput } from '../components/SeoInspector';

export const blogPost = defineType({
  name: 'blogPost',
  title: '블로그 글',
  type: 'document',
  components: {
    input: BlogPostInput,
  },
  groups: [
    { name: 'content', title: '글 작성', default: true },
    { name: 'seo', title: 'SEO 설정' },
  ],
  fields: [
    // ── 글 작성 탭 ──
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      group: 'content',
      description: '블로그 글의 제목을 입력하세요.',
      validation: (Rule) => Rule.required().error('제목은 필수입니다.'),
    }),
    defineField({
      name: 'slug',
      title: '주소(URL)',
      type: 'slug',
      group: 'content',
      description: '제목 입력 후 [Generate] 버튼을 누르면 자동 생성됩니다.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Generate 버튼을 눌러 URL을 만들어주세요.'),
    }),
    defineField({
      name: 'category',
      title: '카테고리',
      type: 'reference',
      to: [{ type: 'blogCategory' }],
      group: 'content',
      description: '글의 분류를 선택하세요. (없으면 왼쪽 메뉴 "카테고리 관리"에서 먼저 추가)',
    }),
    defineField({
      name: 'mainImage',
      title: '대표 이미지',
      type: 'image',
      group: 'content',
      description: '글 목록과 상단에 표시되는 이미지',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: '이미지 설명',
          type: 'string',
          description: '이미지를 설명하는 짧은 문구 (검색엔진 최적화에 도움)',
        },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: '요약 (미리보기 문구)',
      type: 'text',
      rows: 3,
      group: 'content',
      description: '블로그 목록에 표시되는 짧은 소개글 (2~3줄)',
    }),
    defineField({
      name: 'body',
      title: '본문 내용',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            { title: '본문', value: 'normal' },
            { title: '큰 소제목', value: 'h2' },
            { title: '작은 소제목', value: 'h3' },
            { title: '인용문', value: 'blockquote' },
          ],
          lists: [
            { title: '글머리 기호', value: 'bullet' },
            { title: '번호 목록', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: '굵게', value: 'strong' },
              { title: '기울임', value: 'em' },
              { title: '밑줄', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: '링크 삽입',
                fields: [
                  { name: 'href', type: 'url', title: '링크 주소' },
                  { name: 'blank', type: 'boolean', title: '새 탭에서 열기', initialValue: true },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          title: '이미지 삽입',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: '이미지 설명', type: 'string' },
            { name: 'caption', title: '이미지 캡션', type: 'string' },
          ],
        },
        {
          type: 'object',
          name: 'collage',
          title: '콜라주',
          fields: [
            {
              name: 'layout',
              title: '레이아웃',
              type: 'string',
              options: {
                list: [
                  { title: '2칸 그리드', value: 'grid-2' },
                  { title: '3칸 (1L+2R)', value: 'grid-3-1L2R' },
                  { title: '4칸 2x2', value: 'grid-4-2x2' },
                  { title: '벤토 (5장+)', value: 'bento-5plus' },
                ],
              },
            },
            {
              name: 'images',
              title: '이미지 목록',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'asset', type: 'image', options: { hotspot: true } },
                    { name: 'alt', type: 'string', title: '대체 텍스트' },
                    { name: 'aspectRatio', type: 'number', title: '가로/세로 비율' },
                  ],
                  preview: {
                    select: { media: 'asset', title: 'alt' },
                  },
                },
              ],
            },
            { name: 'caption', title: '사진 설명', type: 'string' },
          ],
          preview: {
            select: { layout: 'layout', images: 'images' },
            prepare({ layout, images }) {
              const count = Array.isArray(images) ? images.length : 0;
              return {
                title: `콜라주 (${count}장)`,
                subtitle: layout || '자동',
                media: images?.[0]?.asset,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: '태그',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: '관련 키워드를 입력하고 Enter',
    }),
    defineField({
      name: 'author',
      title: '작성자',
      type: 'reference',
      to: [{ type: 'blogAuthor' }],
      group: 'content',
    }),
    defineField({
      name: 'publishedAt',
      title: '발행일',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
    }),

    // ── SEO 설정 탭 ──
    defineField({
      name: 'seoTitle',
      title: '검색용 제목',
      type: 'string',
      group: 'seo',
      description: '구글/네이버 검색에 보이는 제목. 안 쓰면 글 제목이 사용됩니다. (50~60자 추천)',
      validation: (Rule) => Rule.max(70).warning('60자 이내가 좋습니다.'),
    }),
    defineField({
      name: 'seoDescription',
      title: '검색용 설명',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: '구글/네이버 검색에 보이는 설명. 안 쓰면 요약이 사용됩니다. (120~155자 추천)',
      validation: (Rule) => Rule.max(160).warning('155자 이내가 좋습니다.'),
    }),
    defineField({
      name: 'focusKeyword',
      title: '핵심 키워드',
      type: 'string',
      group: 'seo',
      description: '이 글의 가장 중요한 검색어 1개. 예: "포토부스 렌탈"',
    }),
  ],
  orderings: [
    { title: '최신순', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category.title',
      media: 'mainImage',
      date: 'publishedAt',
    },
    prepare(selection) {
      const { title, category, media, date } = selection;
      const d = date ? new Date(date).toLocaleDateString('ko-KR') : '미발행';
      return {
        title,
        subtitle: `${category || '미분류'} · ${d}`,
        media,
      };
    },
  },
});
