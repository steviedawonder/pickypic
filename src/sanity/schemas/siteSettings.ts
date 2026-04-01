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

    // === scriptInjection fieldset ===
    defineField({ name: 'headScripts', title: 'Head Scripts', type: 'text', rows: 8, fieldset: 'scriptInjection', description: '<head> 안에 삽입할 스크립트' }),
    defineField({ name: 'headMeta', title: 'Head Meta', type: 'text', rows: 6, fieldset: 'scriptInjection', description: '<head> 안에 삽입할 메타 태그' }),
    defineField({ name: 'headCustomCss', title: 'Head Custom CSS', type: 'text', rows: 6, fieldset: 'scriptInjection', description: '<head> 안에 삽입할 커스텀 CSS' }),
    defineField({ name: 'bodyStartScripts', title: 'Body Start Scripts', type: 'text', rows: 6, fieldset: 'scriptInjection', description: '<body> 시작 직후 삽입할 스크립트' }),
    defineField({ name: 'bodyEndScripts', title: 'Body End Scripts', type: 'text', rows: 6, fieldset: 'scriptInjection', description: '<body> 끝 직전에 삽입할 스크립트' }),

    // === externalServices fieldset ===
    defineField({ name: 'gtmContainerId', title: 'GTM Container ID', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'ga4MeasurementId', title: 'GA4 Measurement ID', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'naverAnalyticsId', title: 'Naver Analytics ID', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'kakaoPixelId', title: 'Kakao Pixel ID', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'metaPixelId', title: 'Meta Pixel ID', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'googleSiteVerification', title: 'Google Site Verification', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'naverSiteVerification', title: 'Naver Site Verification', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'naverSyndicationKey', title: 'Naver Syndication Key', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'recaptchaSiteKey', title: 'reCAPTCHA Site Key', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'recaptchaSecretKey', title: 'reCAPTCHA Secret Key', type: 'string', fieldset: 'externalServices' }),
    defineField({ name: 'chatPluginCode', title: 'Chat Plugin Code', type: 'text', rows: 4, fieldset: 'externalServices' }),

    // === emailSettings fieldset ===
    defineField({ name: 'adminEmail', title: '관리자 이메일', type: 'string', fieldset: 'emailSettings' }),
    defineField({ name: 'adminEmailName', title: '관리자 이메일 이름', type: 'string', fieldset: 'emailSettings' }),
    defineField({ name: 'rentalNotifyEmail', title: '렌탈 알림 이메일', type: 'string', fieldset: 'emailSettings' }),
    defineField({ name: 'collabNotifyEmail', title: '협업 알림 이메일', type: 'string', fieldset: 'emailSettings' }),
    defineField({ name: 'slackWebhookUrl', title: 'Slack Webhook URL', type: 'url', fieldset: 'emailSettings' }),

    // === securitySettings fieldset ===
    defineField({ name: 'allowedIps', title: '허용 IP 목록', type: 'text', rows: 4, fieldset: 'securitySettings', description: '줄바꿈으로 구분' }),
    defineField({ name: 'blockedIps', title: '차단 IP 목록', type: 'text', rows: 4, fieldset: 'securitySettings', description: '줄바꿈으로 구분' }),
    defineField({ name: 'maxLoginAttempts', title: '최대 로그인 시도 횟수', type: 'number', fieldset: 'securitySettings' }),

    // === maintenanceMode fieldset ===
    defineField({ name: 'isMaintenanceMode', title: '유지보수 모드', type: 'boolean', fieldset: 'maintenanceMode' }),
    defineField({ name: 'maintenanceMessage', title: '유지보수 안내 메시지', type: 'text', rows: 3, fieldset: 'maintenanceMode' }),
    defineField({ name: 'maintenanceAllowedIps', title: '유지보수 허용 IP', type: 'text', rows: 3, fieldset: 'maintenanceMode', description: '줄바꿈으로 구분' }),
  ],
  fieldsets: [
    {
      name: 'footerInfo',
      title: '하단 정보 (Footer)',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'scriptInjection',
      title: '스크립트 삽입',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'externalServices',
      title: '외부 서비스 연동',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'emailSettings',
      title: '이메일 설정',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'securitySettings',
      title: '보안 설정',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'maintenanceMode',
      title: '유지보수 모드',
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    prepare() {
      return { title: '사이트 설정' };
    },
  },
});
