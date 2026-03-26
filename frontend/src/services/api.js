import axios from 'axios';

// Backend address
const BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Debug interceptors
api.interceptors.request.use(config => {
  console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  error => {
    console.warn(`⚠️ API Error: ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// ONLY using existing backend APIs to avoid 404 errors
export const getCostSummary = () => api.get('/cost/summary');
export const getRiskStats = () => api.get('/risks/stats');
export const getAlerts = () => api.get('/alerts');
export const getResources = () => api.get('/resources');
export const askAI = (question) => api.post('/ask', { question });

// New Modular Feature APIs
export const getCompliance = () => api.get('/compliance');
export const getTopOffenders = (limit = 10) => api.get(`/insights/top-offenders?limit=${limit}`);
export const simulateChanges = (resourceActions) => api.post('/simulate', resourceActions);
export const getRightsizing = () => api.get('/recommendations/rightsizing');
export const getResourceExplanation = (resourceId) => api.get(`/ai/explain/${resourceId}`);
export const getTopDecision = () => api.get('/decisions/top');

// Insight chart endpoints (new)
export const getDashboardScatter = () => api.get('/insights/dashboard-scatter');
export const getTimeTrend = () => api.get('/insights/time-trend');

export default api;
