import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || '7b9lcco4',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

// GROQ Queries
export const blogQueries = {
  // 전체 블로그 목록
  allPosts: `*[_type == "blogPost"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    category-> {
      title,
      slug
    },
    author-> {
      name,
      image {
        asset-> { url }
      }
    },
    tags,
    "estimatedReadingTime": round(length(pt::text(body)) / 500)
  }`,

  // 카테고리별 포스트
  postsByCategory: `*[_type == "blogPost" && category->slug.current == $slug] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    category-> {
      title,
      slug
    },
    author-> {
      name
    },
    tags,
    "estimatedReadingTime": round(length(pt::text(body)) / 500)
  }`,

  // 단일 포스트
  postBySlug: `*[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    body,
    category-> {
      title,
      slug
    },
    author-> {
      name,
      role,
      bio,
      image {
        asset-> { url }
      }
    },
    tags,
    seo,
    "estimatedReadingTime": round(length(pt::text(body)) / 500),
    "relatedPosts": *[_type == "blogPost" && category._ref == ^.category._ref && _id != ^._id] | order(publishedAt desc) [0..2] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage {
        asset-> { url },
        alt
      }
    }
  }`,

  // 전체 카테고리
  allCategories: `*[_type == "blogCategory"] | order(order asc) {
    _id,
    title,
    slug,
    description,
    "postCount": count(*[_type == "blogPost" && references(^._id)])
  }`,
};

// Portfolio Queries
export const portfolioQueries = {
  allItems: `*[_type == "portfolio" && isVisible == true] | order(order desc) {
    _id,
    title,
    image {
      asset-> {
        _id,
        url
      }
    },
    category,
    client
  }`,

  byCategory: `*[_type == "portfolio" && isVisible == true && category == $category] | order(order desc) {
    _id,
    title,
    image {
      asset-> {
        _id,
        url
      }
    },
    category,
    client
  }`,
};

// FAQ Queries
export const faqQueries = {
  byPage: `*[_type == "faqItem" && page == $page] | order(order asc) {
    _id,
    question,
    answer
  }`,
};
