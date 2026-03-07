import { defineType, defineField } from 'sanity';

export const blogCategory = defineType({
  name: 'blogCategory',
  title: '카테고리',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '카테고리 이름',
      type: 'string',
      description: '예: 트렌드, 가이드, 사례, 소식',
      validation: (Rule) => Rule.required().error('이름을 입력해주세요.'),
    }),
    defineField({
      name: 'slug',
      title: '주소(URL)',
      type: 'slug',
      options: { source: 'title' },
      description: 'Generate 버튼을 눌러 자동 생성하세요.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '설명 (선택)',
      type: 'text',
      rows: 2,
    }),
  ],
});
