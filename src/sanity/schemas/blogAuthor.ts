import { defineType, defineField } from 'sanity';

export const blogAuthor = defineType({
  name: 'blogAuthor',
  title: '작성자',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: '이름',
      type: 'string',
      description: '블로그에 표시되는 이름',
      validation: (Rule) => Rule.required().error('이름을 입력해주세요.'),
    }),
    defineField({
      name: 'role',
      title: '직책 (선택)',
      type: 'string',
      description: '예: 에디터, 마케팅팀',
    }),
    defineField({
      name: 'image',
      title: '프로필 사진 (선택)',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
});
