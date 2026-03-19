import { defineType, defineField } from 'sanity';

export const collaborationRequest = defineType({
  name: 'collaborationRequest',
  title: '협업 신청',
  type: 'document',
  fields: [
    defineField({ name: 'collaborationType', title: '협업 형태', type: 'string' }),
    defineField({ name: 'eventName', title: '행사명', type: 'string' }),
    defineField({ name: 'companyName', title: '사업자명', type: 'string' }),
    defineField({ name: 'contactName', title: '담당자', type: 'string' }),
    defineField({ name: 'contactPhone', title: '연락처', type: 'string' }),
    defineField({ name: 'contactEmail', title: '이메일', type: 'string' }),
    defineField({ name: 'installLocation', title: '설치 장소', type: 'string' }),
    defineField({ name: 'eventSchedule', title: '행사 일정', type: 'string' }),
    defineField({ name: 'removalSchedule', title: '철거 일정', type: 'string' }),
    defineField({ name: 'boothType', title: '포토부스 타입', type: 'string' }),
    defineField({ name: 'wrapping', title: '래핑', type: 'string' }),
    defineField({ name: 'shootingType', title: '촬영 타입', type: 'string' }),
    defineField({ name: 'additionalMessage', title: '기타 문의', type: 'text' }),
    defineField({
      name: 'status',
      title: '상태',
      type: 'string',
      options: {
        list: [
          { title: '대기', value: 'pending' },
          { title: '진행중', value: 'in_progress' },
          { title: '완료', value: 'completed' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({ name: 'submittedAt', title: '신청일', type: 'datetime' }),
    defineField({ name: 'memo', title: '관리자 메모', type: 'text' }),
  ],
  preview: {
    select: { title: 'eventName', subtitle: 'companyName' },
  },
});
