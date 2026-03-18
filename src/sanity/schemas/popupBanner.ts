import { defineType, defineField } from 'sanity';

export const popupBanner = defineType({
  name: 'popupBanner',
  title: '팝업 배너',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: '활성화',
      type: 'boolean',
      description: '활성화하면 홈페이지에 팝업이 표시됩니다.',
      initialValue: true,
    }),
    defineField({
      name: 'image',
      title: '배너 이미지',
      type: 'image',
      description: '팝업에 표시할 이미지를 업로드하세요.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'linkUrl',
      title: '링크 URL',
      type: 'string',
      description: '배너 클릭 시 이동할 경로 (예: /rental)',
      initialValue: '/rental',
    }),
    defineField({
      name: 'altText',
      title: '이미지 설명',
      type: 'string',
      description: '접근성을 위한 이미지 설명 텍스트',
      initialValue: '피키픽 포토부스 렌탈 안내',
    }),
  ],
  preview: {
    select: {
      title: 'altText',
      subtitle: 'isActive',
      media: 'image',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || '팝업 배너',
        subtitle: subtitle ? '✅ 활성화' : '❌ 비활성화',
      };
    },
  },
});
