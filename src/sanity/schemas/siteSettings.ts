import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: '사이트 설정',
  type: 'document',
  fields: [
    defineField({
      name: 'defaultSeoTitle',
      title: '기본 SEO 제목',
      type: 'string',
      description: '페이지별 제목이 없을 때 사용되는 기본 제목',
    }),
    defineField({
      name: 'defaultSeoDescription',
      title: '기본 SEO 설명',
      type: 'text',
      rows: 3,
      description: '페이지별 설명이 없을 때 사용되는 기본 메타 설명',
    }),
    defineField({
      name: 'defaultOgImage',
      title: '기본 공유 이미지',
      type: 'image',
      description: 'SNS 공유 시 기본으로 표시되는 이미지 (1200x630px 권장)',
    }),
    defineField({
      name: 'analyticsUrl',
      title: 'Google Analytics URL',
      type: 'url',
      description: 'Google Analytics 대시보드 링크 (바로가기용)',
    }),
  ],
  preview: {
    prepare() {
      return { title: '사이트 설정' };
    },
  },
});
