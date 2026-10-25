// API Configuration supporting local dev proxy, Vercel rewrites, custom URL, or fallback
export const STORAGE_KEY_API_URL = 'satyapramaan_api_url';

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setCustomApiUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    }
  }
}

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export function getEndpoint(path) {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export const API_ENDPOINTS = {
  APPLICATIONS: () => getEndpoint('/api/v1/applications'),
  APPLICATION_DETAIL: (id) => getEndpoint(`/api/v1/applications/${id}`),
  UPLOAD: () => getEndpoint('/api/v1/upload-document'),
  ANALYZE: (id) => getEndpoint(`/api/v1/analyze-document/${id}`),
  VERIFY_DOC: (id) => getEndpoint(`/api/v1/verify-document/${id}`),
  VERIFY_SCORE: (id) => getEndpoint(`/api/v1/verify-trust-score/${id}`),
  RUN_PIPELINE: (id) => getEndpoint(`/api/v1/pipeline/run-full/${id}`),
  REVIEW_DECISION: (id) => getEndpoint(`/api/v1/review-decision/${id}`),
  REGISTRY_RECORDS: () => getEndpoint('/api/v1/registry/records'),
  HEALTH: () => getEndpoint('/health'),
  UPLOADS: (path) => getImageUrl(path)
};

export default API_ENDPOINTS;
