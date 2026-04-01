import { defineType, defineField } from 'sanity';

export const banner = defineType({
  name: 'banner',
  title: '배너',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '배너 제목',
      type: 'string',
      description: '관리용 배너 제목',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'desktopImage',
      title: 'PC 배너 이미지',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mobileImage',
      title: '모바일 배너 이미지',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'linkUrl',
      title: '링크 URL',
      type: 'url',
      description: '클릭 시 이동할 URL',
    }),
    defineField({
      name: 'isActive',
      title: '활성화 여부',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: '표시 순서',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'startDate',
      title: '노출 시작일',
      type: 'datetime',
    }),
    defineField({
      name: 'endDate',
      title: '노출 종료일',
      type: 'datetime',
    }),
    defineField({
      name: 'altText',
      title: '대체 텍스트',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
});
