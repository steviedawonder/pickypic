import { defineType, defineField } from 'sanity';

export const event = defineType({
  name: 'event',
  title: '이벤트',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '이벤트 제목',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: '설명',
      type: 'text',
    }),
    defineField({
      name: 'image',
      title: '이미지',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'linkUrl',
      title: '링크 URL',
      type: 'url',
    }),
    defineField({
      name: 'isActive',
      title: '활성화 여부',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'startDate',
      title: '시작일',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: '종료일',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: '표시 순서',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    prepare({ title, startDate, endDate }) {
      const start = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : '';
      const end = endDate ? new Date(endDate).toLocaleDateString('ko-KR') : '';
      return {
        title: title || '(제목 없음)',
        subtitle: start && end ? `${start} ~ ${end}` : '',
      };
    },
  },
});
