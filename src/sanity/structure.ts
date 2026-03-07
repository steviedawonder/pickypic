import type { StructureBuilder } from 'sanity/structure';

export const seoStructure = (S: StructureBuilder) =>
  S.list()
    .id('root')
    .title('피키픽 블로그 관리')
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
      S.divider(),
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
    ]);
