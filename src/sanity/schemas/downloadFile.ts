import { defineType, defineField } from 'sanity';

export const downloadFile = defineType({
  name: 'downloadFile',
  title: '다운로드 파일',
  type: 'document',
  fields: [
    defineField({
      name: 'displayName',
      title: '표시 이름',
      type: 'string',
      description: '사용자에게 보이는 파일 이름 (예: 레트로 피키 제품소개서)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: '카테고리',
      type: 'string',
      description: '파일 분류',
      options: {
        list: [
          { title: '제품 소개서', value: 'product' },
          { title: '회사 소개서', value: 'company' },
          { title: '카탈로그', value: 'catalog' },
          { title: '기타', value: 'etc' },
        ],
      },
      initialValue: 'product',
    }),
    defineField({
      name: 'linkedProducts',
      title: '연결 제품',
      type: 'array',
      of: [{ type: 'string' }],
      description: '이 파일이 연결될 제품을 선택하세요 (제품소개 페이지에서 해당 제품 선택 시 이 파일이 다운로드됩니다)',
      options: {
        list: [
          { title: 'Modern Picky (모던피키)', value: 'modern-picky' },
          { title: 'Classic Picky (클래식피키)', value: 'classic-picky' },
          { title: 'Urban Picky (어반피키)', value: 'urban-picky' },
          { title: 'Modern Mini Picky (모던미니피키)', value: 'modern-mini-picky' },
          { title: 'Urban Mini Picky (어반미니피키)', value: 'urban-mini-picky' },
          { title: 'Modern Retro Picky (모던레트로피키)', value: 'modern-retro-picky' },
          { title: 'Urban Retro Picky (어반레트로피키)', value: 'urban-retro-picky' },
          { title: 'Outdoor Picky (아웃도어피키)', value: 'outdoor-picky' },
          { title: 'Air Picky (에어피키)', value: 'air-picky' },
        ],
      },
    }),
    defineField({
      name: 'file',
      title: '파일',
      type: 'file',
      description: 'PDF 파일을 업로드하세요.',
      options: { accept: '.pdf' },
    }),
    defineField({
      name: 'isActive',
      title: '공개 여부',
      type: 'boolean',
      description: '비공개로 설정하면 다운로드 목록에 표시되지 않습니다.',
      initialValue: true,
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
      title: 'displayName',
      subtitle: 'category',
      active: 'isActive',
    },
    prepare({ title, subtitle, active }) {
      const categoryMap: Record<string, string> = {
        product: '제품 소개서',
        company: '회사 소개서',
        catalog: '카탈로그',
        etc: '기타',
      };
      return {
        title: title || '다운로드 파일',
        subtitle: `${categoryMap[subtitle] || subtitle} ${active ? '✅' : '❌'}`,
      };
    },
  },
});
