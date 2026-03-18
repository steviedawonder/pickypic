export interface SupportFile {
  name: string;
  size: string;
  path: string;
  thumbnail: string;
}

export interface SupportFileGroup {
  category: string;
  files: SupportFile[];
}

export interface SupportGuide {
  slug: string;
  name: string;
  nameKo: string;
  category: string;
  image: string;
  notice: string;
  fileGroups: SupportFileGroup[];
}

export const supportGuides: SupportGuide[] = [
  {
    slug: 'modern-picky',
    name: 'MODERN PICKY',
    nameKo: '모던피키',
    category: '스탠드형',
    image: '/images/support/support-1.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X6 (in) Frames',
        files: [
          { name: '4cut 2sheet cut 4x3.psd', size: '295.6K', path: '/files/support/modern-picky/4cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/modern-picky/template-1.png' },
          { name: '3cut 2sheet cut 1x1.psd', size: '277.3K', path: '/files/support/modern-picky/3cut_2sheet_cut_1x1.psd' , thumbnail: '/images/support/templates/modern-picky/template-2.png' },
          { name: '3cut 2sheet cut 4x3.psd', size: '253.6K', path: '/files/support/modern-picky/3cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/modern-picky/template-3.png' },
          { name: '3cut 2sheet middle4x3_cut.psd', size: '234.2K', path: '/files/support/modern-picky/3cut_2sheet_middle4x3_cut.psd' , thumbnail: '/images/support/templates/modern-picky/template-4.png' },
        ],
      },
      {
        category: '4X6 (in) Frames',
        files: [
          { name: '1cut 1sheet4x3_2.psd', size: '467.9K', path: '/files/support/modern-picky/1cut_1sheet4x3_2.psd' , thumbnail: '/images/support/templates/modern-picky/template-5.png' },
          { name: '1cut 1sheet 4x3.psd', size: '385.9K', path: '/files/support/modern-picky/1cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/modern-picky/template-6.png' },
          { name: '1x1 4cut middle.psd', size: '424.2K', path: '/files/support/modern-picky/1x1_4cut_middle.psd' , thumbnail: '/images/support/templates/modern-picky/template-7.png' },
          { name: '1x1-4cut-under-noncutting.psd', size: '425.1K', path: '/files/support/modern-picky/1x1-4cut-under-noncutting.psd' , thumbnail: '/images/support/templates/modern-picky/template-8.png' },
          { name: '1x1-4cut-up-noncutting.psd', size: '425.5K', path: '/files/support/modern-picky/1x1-4cut-up-noncutting.psd' , thumbnail: '/images/support/templates/modern-picky/template-9.png' },
          { name: '1x1-8cut-left-noncutting.psd', size: '498.6K', path: '/files/support/modern-picky/1x1-8cut-left-noncutting.psd' , thumbnail: '/images/support/templates/modern-picky/template-10.png' },
          { name: '1x1-8cut-right-noncutting.psd', size: '512.8K', path: '/files/support/modern-picky/1x1-8cut-right-noncutting.psd' , thumbnail: '/images/support/templates/modern-picky/template-11.png' },
          { name: '1x1-8cut-up-noncutting.psd', size: '592.1K', path: '/files/support/modern-picky/1x1-8cut-up-noncutting.psd' , thumbnail: '/images/support/templates/modern-picky/template-12.png' },
          { name: '2cut 1sheet 4x3.psd', size: '402.0K', path: '/files/support/modern-picky/2cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/modern-picky/template-13.png' },
          { name: '3cut 1sheet 3x5.psd', size: '393.9K', path: '/files/support/modern-picky/3cut_1sheet_3x5.psd' , thumbnail: '/images/support/templates/modern-picky/template-14.png' },
          { name: '4cut 1sheet 1x1.psd', size: '415.4K', path: '/files/support/modern-picky/4cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/modern-picky/template-15.png' },
          { name: '4cut 1sheet 01 3.5x5.psd', size: '410.6K', path: '/files/support/modern-picky/4cut_1sheet_01_3.5x5.psd' , thumbnail: '/images/support/templates/modern-picky/template-16.png' },
          { name: '4cut 1sheet 02 3.5x5.psd', size: '437.6K', path: '/files/support/modern-picky/4cut_1sheet_02_3.5x5.psd' , thumbnail: '/images/support/templates/modern-picky/template-17.png' },
          { name: '4cut 1sheet 03 3.5x5.psd', size: '406.1K', path: '/files/support/modern-picky/4cut_1sheet_03_3.5x5.psd' , thumbnail: '/images/support/templates/modern-picky/template-18.png' },
          { name: '6cut 1sheet 1x1.psd', size: '427.8K', path: '/files/support/modern-picky/6cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/modern-picky/template-19.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/modern-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/modern-picky/template-20.png' },
        ],
      },
    ],
  },
  {
    slug: 'classic-picky',
    name: 'CLASSIC PICKY',
    nameKo: '클래식피키',
    category: '스탠드형',
    image: '/images/support/support-2.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: 'Newspaper A5 Size',
        files: [
          { name: 'A5_PICKY_Classic_1cut 1sheet3.5x5.psd', size: '1.6M', path: '/files/support/classic-picky/A5_Classic_1cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-1.png' },
          { name: 'A5_PICKY_Classic_1cut 1sheet 5x3.5.psd', size: '2.2M', path: '/files/support/classic-picky/A5_Classic_1cut_1sheet_5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-2.png' },
          { name: 'A5_PICKY_Classic_2cut 1sheet3.5x5.psd', size: '2.2M', path: '/files/support/classic-picky/A5_Classic_2cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-3.png' },
          { name: 'A5_PICKY_Classic_2cut 1sheet5x3.5.psd', size: '2.1M', path: '/files/support/classic-picky/A5_Classic_2cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-4.png' },
          { name: 'A5_PICKY_Classic_3cut 1sheet3.5x5.psd', size: '3.2M', path: '/files/support/classic-picky/A5_Classic_3cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-5.png' },
          { name: 'A5_PICKY_Classic_3cut 1sheet5x3.5.psd', size: '2.5M', path: '/files/support/classic-picky/A5_Classic_3cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-6.png' },
        ],
      },
      {
        category: 'Newspaper A4 Size',
        files: [
          { name: 'A4_PICKY_Classic_1cut 1sheet3.5x5.psd', size: '3.0M', path: '/files/support/classic-picky/A4_Classic_1cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-7.png' },
          { name: 'A4_PICKY_Classic_1cut 1sheet 5x3.5.psd', size: '4.2M', path: '/files/support/classic-picky/A4_Classic_1cut_1sheet_5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-8.png' },
          { name: 'A4_PICKY_Classic_2cut 1sheet3.5x5.psd', size: '4.1M', path: '/files/support/classic-picky/A4_Classic_2cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-9.png' },
          { name: 'A4_PICKY_Classic_2cut 1sheet5x3.5.psd', size: '3.9M', path: '/files/support/classic-picky/A4_Classic_2cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-10.png' },
          { name: 'A4_PICKY_Classic_3cut 1sheet3.5x5.psd', size: '6.1M', path: '/files/support/classic-picky/A4_Classic_3cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/classic-picky/template-11.png' },
          { name: 'A4_PICKY_Classic_3cut 1sheet5x3.5.psd', size: '4.8M', path: '/files/support/classic-picky/A4_Classic_3cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/classic-picky/template-12.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/classic-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/classic-picky/template-13.png' },
        ],
      },
    ],
  },
  {
    slug: 'urban-picky',
    name: 'URBAN PICKY',
    nameKo: '어반피키',
    category: '스탠드형',
    image: '/images/support/support-3.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X6 (in) Frames',
        files: [
          { name: '4cut 2sheet cut 4x3.psd', size: '295.6K', path: '/files/support/urban-picky/4cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/urban-picky/template-1.png' },
          { name: '3cut 2sheet cut 1x1.psd', size: '277.3K', path: '/files/support/urban-picky/3cut_2sheet_cut_1x1.psd' , thumbnail: '/images/support/templates/urban-picky/template-2.png' },
          { name: '3cut 2sheet cut 4x3.psd', size: '253.6K', path: '/files/support/urban-picky/3cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/urban-picky/template-3.png' },
          { name: '3cut 2sheet middle4x3_cut.psd', size: '234.2K', path: '/files/support/urban-picky/3cut_2sheet_middle4x3_cut.psd' , thumbnail: '/images/support/templates/urban-picky/template-4.png' },
        ],
      },
      {
        category: '4X6 (in) Frames',
        files: [
          { name: '1cut 1sheet4x3_2.psd', size: '467.9K', path: '/files/support/urban-picky/1cut_1sheet4x3_2.psd' , thumbnail: '/images/support/templates/urban-picky/template-5.png' },
          { name: '1cut 1sheet 4x3.psd', size: '385.9K', path: '/files/support/urban-picky/1cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/urban-picky/template-6.png' },
          { name: '1x1 4cut middle.psd', size: '424.2K', path: '/files/support/urban-picky/1x1_4cut_middle.psd' , thumbnail: '/images/support/templates/urban-picky/template-7.png' },
          { name: '1x1-4cut-under-noncutting.psd', size: '425.1K', path: '/files/support/urban-picky/1x1-4cut-under-noncutting.psd' , thumbnail: '/images/support/templates/urban-picky/template-8.png' },
          { name: '1x1-4cut-up-noncutting.psd', size: '425.5K', path: '/files/support/urban-picky/1x1-4cut-up-noncutting.psd' , thumbnail: '/images/support/templates/urban-picky/template-9.png' },
          { name: '1x1-8cut-left-noncutting.psd', size: '498.6K', path: '/files/support/urban-picky/1x1-8cut-left-noncutting.psd' , thumbnail: '/images/support/templates/urban-picky/template-10.png' },
          { name: '1x1-8cut-right-noncutting.psd', size: '512.8K', path: '/files/support/urban-picky/1x1-8cut-right-noncutting.psd' , thumbnail: '/images/support/templates/urban-picky/template-11.png' },
          { name: '1x1-8cut-up-noncutting.psd', size: '592.1K', path: '/files/support/urban-picky/1x1-8cut-up-noncutting.psd' , thumbnail: '/images/support/templates/urban-picky/template-12.png' },
          { name: '2cut 1sheet 4x3.psd', size: '402.0K', path: '/files/support/urban-picky/2cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/urban-picky/template-13.png' },
          { name: '3cut 1sheet 3x5.psd', size: '393.9K', path: '/files/support/urban-picky/3cut_1sheet_3x5.psd' , thumbnail: '/images/support/templates/urban-picky/template-14.png' },
          { name: '4cut 1sheet 1x1.psd', size: '415.4K', path: '/files/support/urban-picky/4cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/urban-picky/template-15.png' },
          { name: '4cut 1sheet 01 3.5x5.psd', size: '410.6K', path: '/files/support/urban-picky/4cut_1sheet_01_3.5x5.psd' , thumbnail: '/images/support/templates/urban-picky/template-16.png' },
          { name: '4cut 1sheet 02 3.5x5.psd', size: '437.6K', path: '/files/support/urban-picky/4cut_1sheet_02_3.5x5.psd' , thumbnail: '/images/support/templates/urban-picky/template-17.png' },
          { name: '4cut 1sheet 03 3.5x5.psd', size: '406.1K', path: '/files/support/urban-picky/4cut_1sheet_03_3.5x5.psd' , thumbnail: '/images/support/templates/urban-picky/template-18.png' },
          { name: '6cut 1sheet 1x1.psd', size: '427.8K', path: '/files/support/urban-picky/6cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/urban-picky/template-19.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/urban-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/urban-picky/template-20.png' },
        ],
      },
    ],
  },
  {
    slug: 'modern-mini-picky',
    name: 'MODERN MINI PICKY',
    nameKo: '모던 미니피키',
    category: '테이블형',
    image: '/images/support/support-4.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X4 (in) Frames',
        files: [
          { name: 'mini_1X1 6cut 3sheet_QR_.psd', size: '399.2K', path: '/files/support/modern-mini-picky/mini_1X1_6cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-1.png' },
          { name: 'mini_6cut 3sheet_top_QR.psd', size: '61.3K', path: '/files/support/modern-mini-picky/mini_6cut_3sheet_top_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-2.png' },
          { name: 'mini_6cut 3sheet_bottom_QR.psd', size: '349.9K', path: '/files/support/modern-mini-picky/mini_6cut_3sheet_bottom_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-3.png' },
          { name: 'mini_3cut 3sheet_QR.psd', size: '355.2K', path: '/files/support/modern-mini-picky/mini_3cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-4.png' },
          { name: 'mini_6cut 3sheet_middle_QR.psd', size: '349.6K', path: '/files/support/modern-mini-picky/mini_6cut_3sheet_middle_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-5.png' },
          { name: 'mini_6cut 3sheet_QR.psd', size: '413.8K', path: '/files/support/modern-mini-picky/mini_6cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/modern-mini-picky/template-6.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/modern-mini-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/modern-mini-picky/template-7.png' },
        ],
      },
    ],
  },
  {
    slug: 'urban-mini-picky',
    name: 'URBAN MINI PICKY',
    nameKo: '어반 미니피키',
    category: '테이블형',
    image: '/images/support/support-5.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X4 (in) Frames',
        files: [
          { name: 'mini_1X1 6cut 3sheet_QR_.psd', size: '399.2K', path: '/files/support/urban-mini-picky/mini_1X1_6cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-1.png' },
          { name: 'mini_6cut 3sheet_top_QR.psd', size: '61.3K', path: '/files/support/urban-mini-picky/mini_6cut_3sheet_top_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-2.png' },
          { name: 'mini_6cut 3sheet_bottom_QR.psd', size: '349.9K', path: '/files/support/urban-mini-picky/mini_6cut_3sheet_bottom_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-3.png' },
          { name: 'mini_6cut 3sheet_middle_QR.psd', size: '349.6K', path: '/files/support/urban-mini-picky/mini_6cut_3sheet_middle_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-4.png' },
          { name: 'mini_3cut 3sheet_QR.psd', size: '355.2K', path: '/files/support/urban-mini-picky/mini_3cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-5.png' },
          { name: 'mini_6cut 3sheet_QR.psd', size: '413.8K', path: '/files/support/urban-mini-picky/mini_6cut_3sheet_QR.psd' , thumbnail: '/images/support/templates/urban-mini-picky/template-6.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/urban-mini-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/urban-mini-picky/template-7.png' },
        ],
      },
    ],
  },
  {
    slug: 'modern-retro-picky',
    name: 'MODERN RETRO PICKY',
    nameKo: '모던 레트로피키',
    category: '테이블형',
    image: '/images/support/support-6.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '감열지 (Thermal Paper)',
        files: [
          { name: 'retro picky_print template_KR.psd', size: '9.9M', path: '/files/support/modern-retro-picky/retro_picky_print_template_KR.psd' , thumbnail: '/images/support/templates/modern-retro-picky/template-1.png' },
        ],
      },
      {
        category: '스티커용지 (Sticker Paper)',
        files: [
          { name: 'retro picky_print template_KR.psd', size: '9.9M', path: '/files/support/modern-retro-picky/retro_picky_sticker_template_KR.psd' , thumbnail: '/images/support/templates/modern-retro-picky/template-2.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: 'retro picky_background template_KR.psd', size: '6.7M', path: '/files/support/modern-retro-picky/retro_picky_background_template_KR.psd' , thumbnail: '/images/support/templates/modern-retro-picky/template-3.png' },
        ],
      },
    ],
  },
  {
    slug: 'urban-retro-picky',
    name: 'URBAN RETRO PICKY',
    nameKo: '어반 레트로피키',
    category: '테이블형',
    image: '/images/support/support-7.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '감열지 (Thermal Paper)',
        files: [
          { name: 'retro picky_print template_KR.psd', size: '9.9M', path: '/files/support/urban-retro-picky/retro_picky_print_template_KR.psd' , thumbnail: '/images/support/templates/urban-retro-picky/template-1.png' },
        ],
      },
      {
        category: '스티커용지 (Sticker Paper)',
        files: [
          { name: 'retro picky_print template_KR.psd', size: '9.9M', path: '/files/support/urban-retro-picky/retro_picky_sticker_template_KR.psd' , thumbnail: '/images/support/templates/urban-retro-picky/template-2.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: 'retro picky_background template_KR.psd', size: '6.7M', path: '/files/support/urban-retro-picky/retro_picky_background_template_KR.psd' , thumbnail: '/images/support/templates/urban-retro-picky/template-3.png' },
        ],
      },
    ],
  },
  {
    slug: 'outdoor-picky',
    name: 'OUTDOOR PICKY',
    nameKo: '아웃도어피키',
    category: '부스형',
    image: '/images/support/support-8.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X6 (in) Frames',
        files: [
          { name: '4cut 2sheet cut 4x3.psd', size: '295.6K', path: '/files/support/outdoor-picky/4cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-1.png' },
          { name: '3cut 2sheet cut 1x1.psd', size: '277.3K', path: '/files/support/outdoor-picky/3cut_2sheet_cut_1x1.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-2.png' },
          { name: '3cut 2sheet cut 4x3.psd', size: '253.6K', path: '/files/support/outdoor-picky/3cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-3.png' },
          { name: '3cut 2sheet middle4x3_cut.psd', size: '234.2K', path: '/files/support/outdoor-picky/3cut_2sheet_middle4x3_cut.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-4.png' },
        ],
      },
      {
        category: '4X6 (in) Frames',
        files: [
          { name: '1cut 1sheet4x3_2.psd', size: '467.9K', path: '/files/support/outdoor-picky/1cut_1sheet4x3_2.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-5.png' },
          { name: '1cut 1sheet 4x3.psd', size: '385.9K', path: '/files/support/outdoor-picky/1cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-6.png' },
          { name: '1x1 4cut middle.psd', size: '424.2K', path: '/files/support/outdoor-picky/1x1_4cut_middle.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-7.png' },
          { name: '1x1-4cut-under-noncutting.psd', size: '425.1K', path: '/files/support/outdoor-picky/1x1-4cut-under-noncutting.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-8.png' },
          { name: '1x1-4cut-up-noncutting.psd', size: '425.5K', path: '/files/support/outdoor-picky/1x1-4cut-up-noncutting.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-9.png' },
          { name: '1x1-8cut-left-noncutting.psd', size: '498.6K', path: '/files/support/outdoor-picky/1x1-8cut-left-noncutting.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-10.png' },
          { name: '1x1-8cut-right-noncutting.psd', size: '512.8K', path: '/files/support/outdoor-picky/1x1-8cut-right-noncutting.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-11.png' },
          { name: '1x1-8cut-up-noncutting.psd', size: '592.1K', path: '/files/support/outdoor-picky/1x1-8cut-up-noncutting.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-12.png' },
          { name: '2cut 1sheet 4x3.psd', size: '402.0K', path: '/files/support/outdoor-picky/2cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-13.png' },
          { name: '3cut 1sheet 3x5.psd', size: '393.9K', path: '/files/support/outdoor-picky/3cut_1sheet_3x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-14.png' },
          { name: '4cut 1sheet 1x1.psd', size: '415.4K', path: '/files/support/outdoor-picky/4cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-15.png' },
          { name: '4cut 1sheet 01 3.5x5.psd', size: '410.6K', path: '/files/support/outdoor-picky/4cut_1sheet_01_3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-16.png' },
          { name: '4cut 1sheet 02 3.5x5.psd', size: '437.6K', path: '/files/support/outdoor-picky/4cut_1sheet_02_3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-17.png' },
          { name: '4cut 1sheet 03 3.5x5.psd', size: '406.1K', path: '/files/support/outdoor-picky/4cut_1sheet_03_3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-18.png' },
          { name: '6cut 1sheet 1x1.psd', size: '427.8K', path: '/files/support/outdoor-picky/6cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-19.png' },
        ],
      },
      {
        category: 'Newspaper A5 Size',
        files: [
          { name: 'A5_PICKY_Classic_1cut 1sheet3.5x5.psd', size: '1.6M', path: '/files/support/outdoor-picky/A5_Classic_1cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-20.png' },
          { name: 'A5_PICKY_Classic_1cut 1sheet 5x3.5.psd', size: '2.2M', path: '/files/support/outdoor-picky/A5_Classic_1cut_1sheet_5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-21.png' },
          { name: 'A5_PICKY_Classic_2cut 1sheet3.5x5.psd', size: '2.2M', path: '/files/support/outdoor-picky/A5_Classic_2cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-22.png' },
          { name: 'A5_PICKY_Classic_2cut 1sheet5x3.5.psd', size: '2.1M', path: '/files/support/outdoor-picky/A5_Classic_2cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-23.png' },
          { name: 'A5_PICKY_Classic_3cut 1sheet3.5x5.psd', size: '3.2M', path: '/files/support/outdoor-picky/A5_Classic_3cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-24.png' },
          { name: 'A5_PICKY_Classic_3cut 1sheet5x3.5.psd', size: '2.5M', path: '/files/support/outdoor-picky/A5_Classic_3cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-25.png' },
        ],
      },
      {
        category: 'Newspaper A4 Size',
        files: [
          { name: 'A4_PICKY_Classic_1cut 1sheet3.5x5.psd', size: '3.0M', path: '/files/support/outdoor-picky/A4_Classic_1cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-26.png' },
          { name: 'A4_PICKY_Classic_1cut 1sheet 5x3.5.psd', size: '4.2M', path: '/files/support/outdoor-picky/A4_Classic_1cut_1sheet_5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-27.png' },
          { name: 'A4_PICKY_Classic_2cut 1sheet3.5x5.psd', size: '4.1M', path: '/files/support/outdoor-picky/A4_Classic_2cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-28.png' },
          { name: 'A4_PICKY_Classic_2cut 1sheet5x3.5.psd', size: '3.9M', path: '/files/support/outdoor-picky/A4_Classic_2cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-29.png' },
          { name: 'A4_PICKY_Classic_3cut 1sheet3.5x5.psd', size: '6.1M', path: '/files/support/outdoor-picky/A4_Classic_3cut_1sheet3.5x5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-30.png' },
          { name: 'A4_PICKY_Classic_3cut 1sheet5x3.5.psd', size: '4.8M', path: '/files/support/outdoor-picky/A4_Classic_3cut_1sheet5x3.5.psd' , thumbnail: '/images/support/templates/outdoor-picky/template-31.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/outdoor-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/outdoor-picky/template-32.png' },
        ],
      },
    ],
  },
  {
    slug: 'air-picky',
    name: 'AIR PICKY',
    nameKo: '에어피키',
    category: '부스형',
    image: '/images/support/support-9.png',
    notice: '템플릿 디자인 범위',
    fileGroups: [
      {
        category: '2X6 (in) Frames',
        files: [
          { name: '3cut 2sheet cut 1x1.psd', size: '277.3K', path: '/files/support/air-picky/3cut_2sheet_cut_1x1.psd' , thumbnail: '/images/support/templates/air-picky/template-1.png' },
          { name: '4cut 2sheet cut 4x3.psd', size: '295.6K', path: '/files/support/air-picky/4cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/air-picky/template-2.png' },
          { name: '3cut 2sheet cut 4x3.psd', size: '253.6K', path: '/files/support/air-picky/3cut_2sheet_cut_4x3.psd' , thumbnail: '/images/support/templates/air-picky/template-3.png' },
          { name: '3cut 2sheet middle4x3_cut.psd', size: '234.2K', path: '/files/support/air-picky/3cut_2sheet_middle4x3_cut.psd' , thumbnail: '/images/support/templates/air-picky/template-4.png' },
        ],
      },
      {
        category: '4X6 (in) Frames',
        files: [
          { name: '1cut 1sheet4x3_2.psd', size: '467.9K', path: '/files/support/air-picky/1cut_1sheet4x3_2.psd' , thumbnail: '/images/support/templates/air-picky/template-5.png' },
          { name: '1cut 1sheet 4x3.psd', size: '385.9K', path: '/files/support/air-picky/1cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/air-picky/template-6.png' },
          { name: '1x1 4cut middle.psd', size: '424.2K', path: '/files/support/air-picky/1x1_4cut_middle.psd' , thumbnail: '/images/support/templates/air-picky/template-7.png' },
          { name: '1x1-4cut-under-noncutting.psd', size: '425.1K', path: '/files/support/air-picky/1x1-4cut-under-noncutting.psd' , thumbnail: '/images/support/templates/air-picky/template-8.png' },
          { name: '1x1-4cut-up-noncutting.psd', size: '425.5K', path: '/files/support/air-picky/1x1-4cut-up-noncutting.psd' , thumbnail: '/images/support/templates/air-picky/template-9.png' },
          { name: '1x1-8cut-left-noncutting.psd', size: '498.6K', path: '/files/support/air-picky/1x1-8cut-left-noncutting.psd' , thumbnail: '/images/support/templates/air-picky/template-10.png' },
          { name: '1x1-8cut-right-noncutting.psd', size: '512.8K', path: '/files/support/air-picky/1x1-8cut-right-noncutting.psd' , thumbnail: '/images/support/templates/air-picky/template-11.png' },
          { name: '1x1-8cut-up-noncutting.psd', size: '592.1K', path: '/files/support/air-picky/1x1-8cut-up-noncutting.psd' , thumbnail: '/images/support/templates/air-picky/template-12.png' },
          { name: '2cut 1sheet 4x3.psd', size: '402.0K', path: '/files/support/air-picky/2cut_1sheet_4x3.psd' , thumbnail: '/images/support/templates/air-picky/template-13.png' },
          { name: '3cut 1sheet 3x5.psd', size: '393.9K', path: '/files/support/air-picky/3cut_1sheet_3x5.psd' , thumbnail: '/images/support/templates/air-picky/template-14.png' },
          { name: '4cut 1sheet 1x1.psd', size: '415.4K', path: '/files/support/air-picky/4cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/air-picky/template-15.png' },
          { name: '4cut 1sheet 01 3.5x5.psd', size: '410.6K', path: '/files/support/air-picky/4cut_1sheet_01_3.5x5.psd' , thumbnail: '/images/support/templates/air-picky/template-16.png' },
          { name: '4cut 1sheet 02 3.5x5.psd', size: '437.6K', path: '/files/support/air-picky/4cut_1sheet_02_3.5x5.psd' , thumbnail: '/images/support/templates/air-picky/template-17.png' },
          { name: '4cut 1sheet 03 3.5x5.psd', size: '406.1K', path: '/files/support/air-picky/4cut_1sheet_03_3.5x5.psd' , thumbnail: '/images/support/templates/air-picky/template-18.png' },
          { name: '6cut 1sheet 1x1.psd', size: '427.8K', path: '/files/support/air-picky/6cut_1sheet_1x1.psd' , thumbnail: '/images/support/templates/air-picky/template-19.png' },
        ],
      },
      {
        category: '화면UI & 화면버튼',
        files: [
          { name: '피키픽_UI 디자인 가이드파일_유료_KR2026.ai', size: '3.5M', path: '/files/support/air-picky/pickypic_ui_guide_2026.ai' , thumbnail: '/images/support/templates/air-picky/template-20.png' },
        ],
      },
    ],
  },
];
