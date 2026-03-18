import { defineType, defineField } from 'sanity';

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: '질문',
      type: 'string',
      validation: (Rule) => Rule.required().error('질문을 입력해주세요.'),
    }),
    defineField({
      name: 'answer',
      title: '답변',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().error('답변을 입력해주세요.'),
    }),
    defineField({
      name: 'page',
      title: '표시 페이지',
      type: 'string',
      description: '이 FAQ가 표시될 페이지를 선택하세요.',
      options: {
        list: [
          { title: '홈페이지', value: 'home' },
          { title: '렌탈문의', value: 'rental' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: '정렬 순서',
      type: 'number',
      description: '숫자가 작을수록 위에 표시됩니다.',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'page',
    },
    prepare({ title, subtitle }) {
      const pageLabel = subtitle === 'home' ? '홈페이지' : subtitle === 'rental' ? '렌탈문의' : subtitle;
      return { title, subtitle: pageLabel };
    },
  },
  orderings: [
    {
      title: '순서',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
});
