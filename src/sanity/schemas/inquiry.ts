import { defineType, defineField } from 'sanity';

export const inquiry = defineType({
  name: 'inquiry',
  title: '문의',
  type: 'document',
  fields: [
    defineField({
      name: 'inquiryType',
      title: '문의 유형',
      type: 'string',
      options: {
        list: [
          { title: '렌탈문의', value: '렌탈문의' },
          { title: '일반문의', value: '일반문의' },
          { title: '기타', value: '기타' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: '이름',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'phone',
      title: '연락처',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: '이메일',
      type: 'string',
    }),
    defineField({
      name: 'company',
      title: '회사명',
      type: 'string',
    }),
    defineField({
      name: 'eventName',
      title: '행사명',
      type: 'string',
    }),
    defineField({
      name: 'eventDate',
      title: '행사 일자',
      type: 'string',
    }),
    defineField({
      name: 'message',
      title: '문의 내용',
      type: 'text',
    }),
    defineField({
      name: 'status',
      title: '상태',
      type: 'string',
      options: {
        list: [
          { title: '대기', value: '대기' },
          { title: '확인', value: '확인' },
          { title: '답변완료', value: '답변완료' },
          { title: '보류', value: '보류' },
        ],
      },
      initialValue: '대기',
    }),
    defineField({
      name: 'memo',
      title: '관리자 메모',
      type: 'text',
    }),
    defineField({
      name: 'submittedAt',
      title: '접수일',
      type: 'datetime',
    }),
    defineField({
      name: 'language',
      title: '언어',
      type: 'string',
      initialValue: 'ko',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      inquiryType: 'inquiryType',
      submittedAt: 'submittedAt',
    },
    prepare({ title, inquiryType, submittedAt }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleDateString('ko-KR') : '';
      return {
        title: title || '(이름 없음)',
        subtitle: [inquiryType, date].filter(Boolean).join(' · '),
      };
    },
  },
});
