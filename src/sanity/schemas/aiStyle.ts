import { defineType, defineField } from 'sanity';
import { aiStyleCategories } from '../../data/aiStyles';

export const aiStyle = defineType({
  name: 'aiStyle',
  title: 'AI 스타일',
  type: 'document',
  fields: [
    defineField({ name: 'nameKo', title: '이름 (한국어)', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'nameEn', title: '이름 (영어)', type: 'string', description: '비우면 한국어 이름이 보입니다.' }),
    defineField({ name: 'nameJp', title: '이름 (일본어)', type: 'string', description: '비우면 한국어 이름이 보입니다.' }),
    defineField({ name: 'descKo', title: '한 줄 설명 (한국어)', type: 'string' }),
    defineField({ name: 'descEn', title: '한 줄 설명 (영어)', type: 'string' }),
    defineField({ name: 'descJp', title: '한 줄 설명 (일본어)', type: 'string' }),
    defineField({
      name: 'category',
      title: '카테고리',
      type: 'string',
      options: { list: aiStyleCategories.map((c) => ({ title: c.label.ko, value: c.id })) },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'image', title: '결과 이미지', type: 'image', validation: (Rule) => Rule.required() }),
    defineField({ name: 'beforeImage', title: '원본 이미지 (선택)', type: 'image', description: '있으면 갤러리에서 원본과 비교할 수 있습니다.' }),
    defineField({
      name: 'people',
      title: '인원',
      type: 'string',
      options: { list: [{ title: '1인', value: 'solo' }, { title: '2인', value: 'duo' }, { title: '단체', value: 'group' }] },
      initialValue: 'solo',
    }),
    defineField({ name: 'isNew', title: 'NEW 표시', type: 'boolean', initialValue: false }),
    defineField({ name: 'isActive', title: '노출', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: '정렬 순서', type: 'number', description: '숫자가 작을수록 앞에 보입니다.', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'nameKo', category: 'category', media: 'image', active: 'isActive' },
    prepare({ title, category, media, active }) {
      const label = aiStyleCategories.find((c) => c.id === category)?.label.ko || category;
      return { title: title || 'AI 스타일', subtitle: `${label} ${active === false ? '❌' : '✅'}`, media };
    },
  },
});
