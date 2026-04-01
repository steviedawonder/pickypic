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
    // 하단 정보 (Footer)
    defineField({
      name: 'companyName',
      title: '회사명',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'businessNumber',
      title: '사업자등록번호',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'address',
      title: '주소',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'phone',
      title: '전화번호',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'email',
      title: '이메일',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'partnerEmail',
      title: '제휴 이메일',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'kakaoChannel',
      title: '카카오 채널명',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'kakaoUrl',
      title: '카카오 채널 URL',
      type: 'url',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'instagramOfficial',
      title: '인스타그램 공식',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'instagramGlobal',
      title: '인스타그램 글로벌',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'instagramSg',
      title: '인스타그램 싱가포르',
      type: 'string',
      fieldset: 'footerInfo',
    }),
    defineField({
      name: 'naverStoreUrl',
      title: '네이버 스토어 URL',
      type: 'url',
      fieldset: 'footerInfo',
    }),
  ],
  fieldsets: [
    {
      name: 'footerInfo',
      title: '하단 정보 (Footer)',
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    prepare() {
      return { title: '사이트 설정' };
    },
  },
});
