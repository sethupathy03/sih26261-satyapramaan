// API Configuration supporting local dev proxy, Vercel rewrites, or direct backend cloud URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  APPLICATIONS: `${API_BASE_URL}/api/v1/applications`,
  UPLOAD: `${API_BASE_URL}/api/v1/upload-document`,
  ANALYZE: (id) => `${API_BASE_URL}/api/v1/analyze-document/${id}`,
  VERIFY_DOC: (id) => `${API_BASE_URL}/api/v1/verify-document/${id}`,
  VERIFY_SCORE: (id) => `${API_BASE_URL}/api/v1/verify-trust-score/${id}`,
  RUN_PIPELINE: (id) => `${API_BASE_URL}/api/v1/pipeline/run-full/${id}`,
  REVIEW_DECISION: (id) => `${API_BASE_URL}/api/v1/review-decision/${id}`,
  REGISTRY_RECORDS: `${API_BASE_URL}/api/v1/registry/records`,
  HEALTH: `${API_BASE_URL}/health`,
  UPLOADS: (path) => `${API_BASE_URL}${path}`
};

export default API_ENDPOINTS;
