import { defineType, defineField } from 'sanity';

export const portfolio = defineType({
  name: 'portfolio',
  title: '포트폴리오',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '제목',
      type: 'string',
      description: '포트폴리오 항목 제목 (예: Netflix Korea x PICKYPIC)',
      validation: (Rule) => Rule.required().error('제목은 필수입니다.'),
    }),
    defineField({
      name: 'image',
      title: '이미지',
      type: 'image',
      description: '포트폴리오 이미지를 업로드하세요.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required().error('이미지는 필수입니다.'),
    }),
    defineField({
      name: 'category',
      title: '포토부스 모델',
      type: 'string',
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
      description: '협업 브랜드명 (선택사항)',
    }),
    defineField({
      name: 'order',
      title: '정렬 순서',
      type: 'number',
      description: '숫자가 클수록 위에 표시됩니다.',
      initialValue: 0,
    }),
    defineField({
      name: 'isVisible',
      title: '표시 여부',
      type: 'boolean',
      description: '비활성화하면 사이트에 표시되지 않습니다.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'image',
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
