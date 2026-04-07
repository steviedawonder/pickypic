import { defineType, defineField } from 'sanity';

export const portfolio = defineType({
  name: 'portfolio',
  title: '포트폴리오',
  type: 'document',
  groups: [
    { name: 'content', title: '콘텐츠', default: true },
    { name: 'seo', title: 'SEO 설정' },
  ],
  fields: [
    // ── Content Tab ──
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      group: 'content',
      description: '포트폴리오 항목 제목 (예: Netflix Korea x PICKYPIC)',
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
      validation: (Rule) => Rule.required().error('URL을 생성해주세요.'),
    }),
    defineField({
      name: 'category',
      title: '포토부스 모델',
      type: 'string',
      group: 'content',
      description: '사용된 포토부스 모델을 선택하세요.',
      options: {
        list: [
          { title: 'Modern Picky (모던피키)', value: 'modern-picky' },
          { title: 'Classic Picky (클래식피키)', value: 'classic-picky' },
          { title: 'Urban Picky (어반피키)', value: 'urban-picky' },
          { title: 'Modern Mini Picky (모던미니피키)', value: 'modern-mini' },
          { title: 'Urban Mini Picky (어반미니피키)', value: 'urban-mini' },
          { title: 'Modern Retro Picky (모던레트로피키)', value: 'modern-retro' },
          { title: 'Urban Retro Picky (어반레트로피키)', value: 'urban-retro' },
          { title: 'Outdoor Picky (아웃도어피키)', value: 'outdoor' },
          { title: 'Air Picky (에어피키)', value: 'air' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required().error('카테고리를 선택해주세요.'),
    }),
    defineField({
      name: 'client',
      title: '클라이언트(브랜드명)',
      type: 'string',
      group: 'content',
      description: '협업 브랜드명 (선택사항)',
    }),
    defineField({
      name: 'description',
      title: '설명',
      type: 'string',
      group: 'content',
      description: '포트폴리오 설명 (예: 설화수 x 피키픽)',
    }),
    defineField({
      name: 'rentalDevice',
      title: '렌탈 기기',
      type: 'string',
      group: 'content',
      description: '렌탈 기기 정보 (예: 렌탈 기기 : Modern Picky_wood(white oak))',
    }),
    defineField({
      name: 'thumbnail',
      title: '썸네일 이미지',
      type: 'image',
      group: 'content',
      description: '목록에 표시되는 대표 이미지',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: '이미지 설명 (Alt Text)', type: 'string', description: 'SEO: 검색엔진이 이미지를 이해하도록 설명' },
      ],
    }),
    defineField({
      name: 'images',
      title: '상세 이미지',
      type: 'array',
      group: 'content',
      description: '포트폴리오 상세 페이지에 표시되는 이미지들',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: '이미지 설명 (Alt Text)', type: 'string', description: 'SEO: 검색엔진이 이미지를 이해하도록 설명' },
            { name: 'caption', title: '캡션', type: 'string', description: '이미지 하단에 표시되는 설명' },
          ],
        },
      ],
    }),
    defineField({
      name: 'body',
      title: '본문 내용',
      type: 'array',
      group: 'content',
      description: '이미지 아래에 표시되는 본문 텍스트',
      of: [
        {
          type: 'block',
          styles: [
            { title: '본문', value: 'normal' },
            { title: '큰 소제목', value: 'h2' },
            { title: '작은 소제목', value: 'h3' },
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
      ],
    }),
    defineField({
      name: 'order',
      title: '정렬 순서',
      type: 'number',
      group: 'content',
      description: '숫자가 클수록 위에 표시됩니다.',
      initialValue: 0,
    }),
    defineField({
      name: 'isVisible',
      title: '표시 여부',
      type: 'boolean',
      group: 'content',
      description: '비활성화하면 사이트에 표시되지 않습니다.',
      initialValue: true,
    }),

    // ── SEO Tab ──
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
      description: '구글/네이버 검색에 보이는 설명. (120~155자 추천)',
      validation: (Rule) => Rule.max(160).warning('155자 이내가 좋습니다.'),
    }),
    defineField({
      name: 'focusKeyword',
      title: '핵심 키워드',
      type: 'string',
      group: 'seo',
      description: '이 포트폴리오의 가장 중요한 검색어 1개. 예: "설화수 포토부스 렌탈"',
    }),

    // Legacy field - kept for backward compatibility during migration
    defineField({
      name: 'image',
      title: '이미지 (레거시)',
      type: 'image',
      options: { hotspot: true },
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'thumbnail',
    },
  },
  orderings: [
    {
      title: '최신 순',
      name: 'orderDesc',
      by: [{ field: 'order', direction: 'desc' }],
    },
  ],
});
