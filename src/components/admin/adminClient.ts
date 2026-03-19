import { createClient } from '@sanity/client';

// Sanity API 토큰 (sanity.io/manage > API > Tokens에서 Editor 권한으로 생성)
const SANITY_TOKEN = 'skrKYET4T3eI3gjxAn1QSq7D7Xr1QUrItYlZJ4raBKET6BE2LeMJlYbvgusk36LnlL0hQH0kJZ2HDYTPffdDSuecTjc9eCzlhuLL2MKFlUaV406LPblIcWDn7Gms3sb4OHoZWDdpKx91USwYOmqexS2VPgjQOOkLm3VKmGozcKAs35JqaIY2';

export const adminClient = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: SANITY_TOKEN,
});

// ── Blog ──
export async function fetchBlogPosts() {
  return adminClient.fetch(`*[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt,
    category-> { title },
    tags,
    "status": select(publishedAt != null => "발행됨", "임시저장"),
    "bodyLength": length(pt::text(body))
  }`);
}

export async function fetchBlogPost(id: string) {
  return adminClient.fetch(`*[_type == "blogPost" && _id == $id][0] {
    _id, title, slug, excerpt, body, publishedAt,
    category-> { _id, title },
    tags, focusKeyword, seoTitle, seoDescription,
    mainImage { asset-> { _id, url }, alt }
  }`, { id });
}

export async function fetchCategories() {
  return adminClient.fetch(`*[_type == "blogCategory"] | order(title asc) {
    _id, title, slug,
    "postCount": count(*[_type == "blogPost" && references(^._id)])
  }`);
}

export async function createBlogPost(data: any) {
  return adminClient.create({ _type: 'blogPost', ...data });
}

export async function updateBlogPost(id: string, data: any) {
  return adminClient.patch(id).set(data).commit();
}

export async function deleteBlogPost(id: string) {
  return adminClient.delete(id);
}

// ── Portfolio ──
export async function fetchPortfolioItems() {
  return adminClient.fetch(`*[_type == "portfolio"] | order(order desc) {
    _id, title, category, client, order, isVisible,
    image { asset-> { _id, url } }
  }`);
}

export async function createPortfolioItem(data: any) {
  return adminClient.create({ _type: 'portfolio', ...data });
}

export async function updatePortfolioItem(id: string, data: any) {
  return adminClient.patch(id).set(data).commit();
}

export async function deletePortfolioItem(id: string) {
  return adminClient.delete(id);
}

export async function uploadImage(file: File) {
  return adminClient.assets.upload('image', file);
}

// ── FAQ ──
export async function fetchFAQItems() {
  return adminClient.fetch(`*[_type == "faqItem"] | order(page asc, order asc) {
    _id, question, answer, page, order
  }`);
}

export async function createFAQItem(data: any) {
  return adminClient.create({ _type: 'faqItem', ...data });
}

export async function updateFAQItem(id: string, data: any) {
  return adminClient.patch(id).set(data).commit();
}

export async function deleteFAQItem(id: string) {
  return adminClient.delete(id);
}

// ── Collaboration ──
export async function fetchCollaborationRequests() {
  return adminClient.fetch(`*[_type == "collaborationRequest"] | order(submittedAt desc) {
    _id, collaborationType, eventName, companyName, contactName, contactPhone, contactEmail,
    installLocation, eventSchedule, removalSchedule, boothType, wrapping, shootingType,
    additionalMessage, status, submittedAt, memo
  }`);
}

export async function createCollaborationRequest(data: any) {
  return adminClient.create({ _type: 'collaborationRequest', ...data });
}

export async function updateCollaborationRequest(id: string, data: any) {
  return adminClient.patch(id).set(data).commit();
}

export async function deleteCollaborationRequest(id: string) {
  return adminClient.delete(id);
}

// ── Popup Banner ──
export async function fetchPopupBanners() {
  return adminClient.fetch(`*[_type == "popupBanner"] {
    _id, isActive, linkUrl, altText,
    image { asset-> { _id, url } }
  }`);
}

export async function createPopupBanner(data: any) {
  return adminClient.create({ _type: 'popupBanner', ...data });
}

export async function updatePopupBanner(id: string, data: any) {
  return adminClient.patch(id).set(data).commit();
}

export async function deletePopupBanner(id: string) {
  return adminClient.delete(id);
}

// ── Dashboard Stats ──
export async function fetchDashboardStats() {
  const [totalPosts, published, drafts, categories, portfolioCount, faqCount] = await Promise.all([
    adminClient.fetch(`count(*[_type == "blogPost"])`),
    adminClient.fetch(`count(*[_type == "blogPost" && publishedAt != null])`),
    adminClient.fetch(`count(*[_type == "blogPost" && publishedAt == null])`),
    adminClient.fetch(`*[_type == "blogCategory"] { title, "count": count(*[_type == "blogPost" && references(^._id)]) }`),
    adminClient.fetch(`count(*[_type == "portfolio"])`),
    adminClient.fetch(`count(*[_type == "faqItem"])`),
  ]);
  return { totalPosts, published, drafts, categories, portfolioCount, faqCount };
}
