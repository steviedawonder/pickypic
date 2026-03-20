// Admin client - all Sanity mutations go through /api/sanity server-side proxy.
// The Sanity API token is never exposed to the browser.

const ADMIN_PASSWORD = import.meta.env.PUBLIC_ADMIN_PASSWORD || 'pickypic2020';

function getAuthHeaders(): Record<string, string> {
  return { 'x-admin-auth': ADMIN_PASSWORD };
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
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
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
    _id, title, slug, excerpt, body, publishedAt,
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

// ── Portfolio ──
export async function fetchPortfolioItems() {
  return sanityFetch(`*[_type == "portfolio"] | order(order desc) {
    _id, title, category, client, order, isVisible,
    image { asset-> { _id, url } }
  }`);
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

export async function uploadImage(file: File) {
  return sanityUpload('uploadImage', file);
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

// ── Dashboard Stats ──
export async function fetchDashboardStats() {
  const [totalPosts, published, drafts, categories, portfolioCount, faqCount] = await Promise.all([
    sanityFetch(`count(*[_type == "blogPost"])`),
    sanityFetch(`count(*[_type == "blogPost" && publishedAt != null])`),
    sanityFetch(`count(*[_type == "blogPost" && publishedAt == null])`),
    sanityFetch(`*[_type == "blogCategory"] { title, "count": count(*[_type == "blogPost" && references(^._id)]) }`),
    sanityFetch(`count(*[_type == "portfolio"])`),
    sanityFetch(`count(*[_type == "faqItem"])`),
  ]);
  return { totalPosts, published, drafts, categories, portfolioCount, faqCount };
}
