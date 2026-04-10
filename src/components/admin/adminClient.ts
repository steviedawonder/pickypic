// Admin client - all Sanity mutations go through /api/sanity server-side proxy.
// The Sanity API token is never exposed to the browser.

import { compressImage } from './shared/imageUtils';

const AUTH_STORAGE_KEY = 'pickypic-admin-auth';

function getAuthHeaders(): Record<string, string> {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_STORAGE_KEY)) || '';
  return { 'x-admin-auth': token };
}

async function sanityAction(body: Record<string, unknown>) {
  const res = await fetch('/api/sanity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

async function sanityFetch(query: string, params?: Record<string, unknown>) {
  return sanityAction({ action: 'fetch', query, params });
}

async function sanityCreate(data: Record<string, unknown>) {
  return sanityAction({ action: 'create', data });
}

async function sanityUpdate(id: string, data: Record<string, unknown>) {
  return sanityAction({ action: 'update', id, data });
}

async function sanityDelete(id: string) {
  return sanityAction({ action: 'delete', id });
}

async function sanityUpload(action: 'uploadImage' | 'uploadFile', file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  return sanityAction({
    action,
    fileData: base64,
    fileName: file.name,
    fileType: file.type,
  });
}

// ── Blog ──
export async function fetchBlogPosts() {
  return sanityFetch(`*[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt,
    category-> { title },
    tags,
    "status": select(publishedAt != null => "발행됨", "임시저장"),
    "bodyLength": length(pt::text(body))
  }`);
}

export async function fetchBlogPost(id: string) {
  return sanityFetch(`*[_type == "blogPost" && _id == $id][0] {
    _id, title, slug, excerpt, publishedAt,
    body[] {
      ...,
      _type == "image" => {
        ...,
        asset-> { _id, url }
      }
    },
    category-> { _id, title },
    tags, focusKeyword, seoTitle, seoDescription,
    mainImage { asset-> { _id, url }, alt }
  }`, { id });
}

export async function fetchCategories() {
  return sanityFetch(`*[_type == "blogCategory"] | order(title asc) {
    _id, title, slug,
    "postCount": count(*[_type == "blogPost" && references(^._id)])
  }`);
}

export async function createBlogPost(data: any) {
  return sanityCreate({ _type: 'blogPost', ...data });
}

export async function updateBlogPost(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deleteBlogPost(id: string) {
  return sanityDelete(id);
}

// ── Tags ──
export async function fetchTags() {
  return sanityFetch(`*[_type == "blogTag"] | order(title asc) { _id, title }`);
}

export async function createTag(title: string) {
  return sanityCreate({ _type: 'blogTag', title });
}

// ── Blog Templates ──
export async function fetchBlogTemplates() {
  return sanityFetch(`*[_type == "blogTemplate"] | order(_createdAt desc) {
    _id, title, body, tags, excerpt, focusKeyword, seoTitle, seoDescription,
    "categoryId": category._ref
  }`);
}

export async function createBlogTemplate(data: any) {
  return sanityCreate({ _type: 'blogTemplate', ...data });
}

export async function deleteBlogTemplate(id: string) {
  return sanityDelete(id);
}

// ── Portfolio ──
export async function fetchPortfolioItems() {
  return sanityFetch(`*[_type == "portfolio"] | order(order desc) {
    _id, title, slug, category, client, description, order, isVisible,
    thumbnail { asset-> { _id, url }, alt },
    "imageCount": count(images),
    "hasBody": defined(body)
  }`);
}

export async function fetchPortfolioItem(id: string) {
  return sanityFetch(`*[_type == "portfolio" && _id == $id][0] {
    _id, title, slug, category, client, description, order, isVisible,
    thumbnail { asset-> { _id, url }, alt },
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
    seoTitle, seoDescription, focusKeyword
  }`, { id });
}

export async function createPortfolioItem(data: any) {
  return sanityCreate({ _type: 'portfolio', ...data });
}

export async function updatePortfolioItem(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deletePortfolioItem(id: string) {
  return sanityDelete(id);
}

export async function uploadImage(file: File, onStatus?: (status: string) => void) {
  // Compress image if over 1MB (client-side, canvas API)
  let processedFile = file;
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.size > 1 * 1024 * 1024) {
    onStatus?.('압축 중...');
    processedFile = await compressImage(file);
  }
  onStatus?.('업로드 중...');
  const result = await sanityUpload('uploadImage', processedFile);
  onStatus?.('');
  return result;
}

// ── FAQ ──
export async function fetchFAQItems() {
  return sanityFetch(`*[_type == "faqItem"] | order(page asc, order asc) {
    _id, question, answer, page, order
  }`);
}

export async function createFAQItem(data: any) {
  return sanityCreate({ _type: 'faqItem', ...data });
}

export async function updateFAQItem(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deleteFAQItem(id: string) {
  return sanityDelete(id);
}

// ── Collaboration ──
export async function fetchCollaborationRequests() {
  return sanityFetch(`*[_type == "collaborationRequest"] | order(submittedAt desc) {
    _id, collaborationType, eventName, companyName, contactName, contactPhone, contactEmail,
    installLocation, eventSchedule, removalSchedule, boothType, wrapping, shootingType,
    additionalMessage, status, submittedAt, memo
  }`);
}

export async function createCollaborationRequest(data: any) {
  return sanityCreate({ _type: 'collaborationRequest', ...data });
}

export async function updateCollaborationRequest(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deleteCollaborationRequest(id: string) {
  return sanityDelete(id);
}

// ── Popup Banner ──
export async function fetchPopupBanners() {
  return sanityFetch(`*[_type == "popupBanner"] {
    _id, isActive, linkUrl, altText,
    image { asset-> { _id, url } }
  }`);
}

export async function createPopupBanner(data: any) {
  return sanityCreate({ _type: 'popupBanner', ...data });
}

export async function updatePopupBanner(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deletePopupBanner(id: string) {
  return sanityDelete(id);
}

// ── Download Files ──
export async function fetchDownloadFiles() {
  return sanityFetch(`*[_type == "downloadFile"] | order(order asc) {
    _id, displayName, category, isActive, order, linkedProducts,
    "fileUrl": file.asset->url,
    "fileName": file.asset->originalFilename,
    "fileSize": file.asset->size
  }`);
}

export async function createDownloadFile(data: any) {
  return sanityCreate({ _type: 'downloadFile', ...data });
}

export async function updateDownloadFile(id: string, data: any) {
  return sanityUpdate(id, data);
}

export async function deleteDownloadFile(id: string) {
  return sanityDelete(id);
}

export async function uploadFile(file: File) {
  return sanityUpload('uploadFile', file);
}

// ── Banner ──
export async function fetchBanners() {
  return sanityFetch(`*[_type == "banner"] | order(order asc) {
    _id, title, altText, linkUrl, isActive, order, startDate, endDate,
    desktopImage { asset-> { _id, url } },
    mobileImage { asset-> { _id, url } }
  }`);
}
export async function createBanner(data: any) { return sanityCreate({ _type: 'banner', ...data }); }
export async function updateBanner(id: string, data: any) { return sanityUpdate(id, data); }
export async function deleteBanner(id: string) { return sanityDelete(id); }

// ── Inquiry ──
export async function fetchInquiries() {
  return sanityFetch(`*[_type == "inquiry"] | order(submittedAt desc) {
    _id, inquiryType, name, phone, email, company, eventName, eventDate,
    message, status, memo, submittedAt, language
  }`);
}
export async function updateInquiry(id: string, data: any) { return sanityUpdate(id, data); }
export async function deleteInquiry(id: string) { return sanityDelete(id); }

// ── Event ──
export async function fetchEvents() {
  return sanityFetch(`*[_type == "event"] | order(startDate desc) {
    _id, title, description, linkUrl, isActive, startDate, endDate, order,
    image { asset-> { _id, url } }
  }`);
}
export async function createEvent(data: any) { return sanityCreate({ _type: 'event', ...data }); }
export async function updateEvent(id: string, data: any) { return sanityUpdate(id, data); }
export async function deleteEvent(id: string) { return sanityDelete(id); }

// ── Site Settings ──
export async function fetchSiteSettings() {
  return sanityFetch(`*[_type == "siteSettings"][0] {
    _id, defaultSeoTitle, defaultSeoDescription, analyticsUrl,
    companyName, businessNumber, address, phone, email, partnerEmail,
    kakaoChannel, kakaoUrl, instagramOfficial, instagramGlobal, instagramSg, naverStoreUrl,
    headScripts, headMeta, headCustomCss, bodyStartScripts, bodyEndScripts,
    gtmContainerId, ga4MeasurementId, naverAnalyticsId, kakaoPixelId, metaPixelId,
    googleSiteVerification, naverSiteVerification, naverSyndicationKey,
    recaptchaSiteKey, recaptchaSecretKey, chatPluginCode,
    adminEmail, adminEmailName, rentalNotifyEmail, collabNotifyEmail, slackWebhookUrl,
    allowedIps, blockedIps, maxLoginAttempts,
    isMaintenanceMode, maintenanceMessage, maintenanceAllowedIps
  }`);
}
export async function updateSiteSettings(id: string, data: any) { return sanityUpdate(id, data); }

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'changePassword', currentPassword, newPassword }),
  });
  return res.json();
}

// ── Vercel Rebuild Trigger (서버 API 경유, CORS 우회) ──
export async function triggerRebuild() {
  try {
    await sanityAction({ action: 'triggerRebuild' });
    return true;
  } catch {
    return false;
  }
}

// ── Dashboard Stats ──
export async function fetchDashboardStats() {
  const [totalPosts, published, drafts, categories, portfolioCount, faqCount, inquiryCount, inquiryPending, bannerCount, eventCount] = await Promise.all([
    sanityFetch(`count(*[_type == "blogPost"])`),
    sanityFetch(`count(*[_type == "blogPost" && publishedAt != null])`),
    sanityFetch(`count(*[_type == "blogPost" && publishedAt == null])`),
    sanityFetch(`*[_type == "blogCategory"] { title, "count": count(*[_type == "blogPost" && references(^._id)]) }`),
    sanityFetch(`count(*[_type == "portfolio"])`),
    sanityFetch(`count(*[_type == "faqItem"])`),
    sanityFetch(`count(*[_type == "inquiry"])`),
    sanityFetch(`count(*[_type == "inquiry" && status == "대기"])`),
    sanityFetch(`count(*[_type == "banner" && isActive == true])`),
    sanityFetch(`count(*[_type == "event" && isActive == true])`),
  ]);
  return { totalPosts, published, drafts, categories, portfolioCount, faqCount, inquiryCount, inquiryPending, bannerCount, eventCount };
}
