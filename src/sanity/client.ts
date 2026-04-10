import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
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
    slug,
    thumbnail {
      asset-> { _id, url },
      alt
    },
    category,
    client,
    description,
  }`,

  byCategory: `*[_type == "portfolio" && isVisible == true && category == $category] | order(order desc) {
    _id,
    title,
    slug,
    thumbnail {
      asset-> { _id, url },
      alt
    },
    category,
    client,
    description,
  }`,

  bySlug: `*[_type == "portfolio" && slug.current == $slug && isVisible == true][0] {
    _id,
    title,
    slug,
    category,
    client,
    description,
    thumbnail {
      asset-> { _id, url },
      alt
    },
    images[] {
      ...,
      asset-> { _id, url }
    },
    body[] {
      ...,
      _type == "image" => {
        ...,
        asset-> { _id, url }
      }
    },
    seoTitle,
    seoDescription,
    focusKeyword,
    "relatedItems": *[_type == "portfolio" && category == ^.category && _id != ^._id && isVisible == true] | order(order desc) [0..2] {
      _id, title, slug, category,
      thumbnail { asset-> { url }, alt }
    }
  }`,
};

// FAQ Queries
export const faqQueries = {
  byPage: `*[_type == "faqItem" && page == $page] | order(order asc) {
    _id,
    question,
    answer,
    questionEn,
    answerEn,
    questionJp,
    answerJp
  }`,
};

// Banner Queries
export const bannerQueries = {
  activeBanners: `*[_type == "banner" && isActive == true &&
    (startDate == null || startDate <= now()) &&
    (endDate == null || endDate >= now())] | order(order asc) {
    _id, title, altText, linkUrl, order,
    desktopImage { asset-> { _id, url } },
    mobileImage { asset-> { _id, url } }
  }`,
};

// Inquiry Queries
export const inquiryQueries = {
  all: `*[_type == "inquiry"] | order(submittedAt desc) {
    _id, inquiryType, name, phone, email, company, eventName, eventDate,
    message, status, memo, submittedAt, language
  }`,
};

// Event Queries
export const eventQueries = {
  activeEvents: `*[_type == "event" && isActive == true &&
    startDate <= now() && endDate >= now()] | order(order asc) {
    _id, title, description, linkUrl, startDate, endDate,
    image { asset-> { _id, url } }
  }`,
  allEvents: `*[_type == "event"] | order(startDate desc) {
    _id, title, description, linkUrl, isActive, startDate, endDate, order,
    image { asset-> { _id, url } }
  }`,
};
