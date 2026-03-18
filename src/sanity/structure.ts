import type { StructureBuilder } from 'sanity/structure';

export const seoStructure = (S: StructureBuilder) =>
  S.list()
    .id('root')
    .title('PICKYPIC 관리자')
    .items([
      // ── 블로그 ──
      S.listItem()
        .id('blog-section')
        .title('📝 블로그')
        .child(
          S.list()
            .id('blog-list')
            .title('블로그 관리')
            .items([
              S.listItem()
                .id('blogPost')
                .title('✏️ 글 쓰기 / 관리')
                .schemaType('blogPost')
                .child(
                  S.documentTypeList('blogPost')
                    .id('blogPostList')
                    .title('블로그 글 목록')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                ),
              S.listItem()
                .id('blogCategory')
                .title('📁 카테고리 관리')
                .schemaType('blogCategory')
                .child(
                  S.documentTypeList('blogCategory')
                    .id('blogCategoryList')
                    .title('카테고리 목록')
                ),
              S.listItem()
                .id('blogAuthor')
                .title('👤 작성자 관리')
                .schemaType('blogAuthor')
                .child(
                  S.documentTypeList('blogAuthor')
                    .id('blogAuthorList')
                    .title('작성자 목록')
                ),
            ])
        ),

      S.divider(),

      // ── 포트폴리오 ──
      S.listItem()
        .id('portfolio')
        .title('📸 포트폴리오')
        .schemaType('portfolio')
        .child(
          S.documentTypeList('portfolio')
            .id('portfolioList')
            .title('포트폴리오 관리')
            .defaultOrdering([{ field: 'order', direction: 'desc' }])
        ),

      S.divider(),

      // ── 사이트 관리 ──
      S.listItem()
        .id('site-section')
        .title('⚙️ 사이트 관리')
        .child(
          S.list()
            .id('site-list')
            .title('사이트 관리')
            .items([
              S.listItem()
                .id('faqItem')
                .title('❓ FAQ 관리')
                .schemaType('faqItem')
                .child(
                  S.documentTypeList('faqItem')
                    .id('faqItemList')
                    .title('FAQ 목록')
                    .defaultOrdering([{ field: 'order', direction: 'asc' }])
                ),
              S.listItem()
                .id('popupBanner')
                .title('🖼️ 팝업 배너')
                .schemaType('popupBanner')
                .child(
                  S.documentTypeList('popupBanner')
                    .id('popupBannerList')
                    .title('팝업 배너 관리')
                ),
              S.listItem()
                .id('siteSettings')
                .title('⚙️ 사이트 설정')
                .schemaType('siteSettings')
                .child(
                  S.documentTypeList('siteSettings')
                    .id('siteSettingsList')
                    .title('사이트 설정')
                ),
            ])
        ),
    ]);
