import axios from 'axios';
import type {
  Incident,
  IncidentActivity,
  KnowledgeArticle,
  ListIncidentsResponse,
  IncidentDetailResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Response interceptor for error normalization
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ??
      err.response?.data?.message ??
      err.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// ============================================================
// Incidents API
// ============================================================

export const incidentsApi = {
  list: async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListIncidentsResponse> => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },

  get: async (id: string): Promise<IncidentDetailResponse> => {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
  },

  create: async (data: { title: string; description: string }): Promise<{ incident: Incident }> => {
    const res = await api.post('/incidents', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Incident>): Promise<{ incident: Incident }> => {
    const res = await api.patch(`/incidents/${id}`, data);
    return res.data;
  },

  analyze: async (id: string, trigger?: string): Promise<{ message: string }> => {
    const res = await api.post(`/incidents/${id}/analyze`, { trigger });
    return res.data;
  },

  addComment: async (
    id: string,
    data: { comment: string; engineer?: string },
  ): Promise<{ activity: IncidentActivity }> => {
    const res = await api.post(`/incidents/${id}/comments`, data);
    return res.data;
  },

  escalate: async (
    id: string,
    data: { target_team: string; reason: string; engineer?: string },
  ): Promise<{ incident: Incident }> => {
    const res = await api.post(`/incidents/${id}/escalate`, data);
    return res.data;
  },

  resolve: async (
    id: string,
    data: { resolution: string; engineer?: string },
  ): Promise<{ incident: Incident }> => {
    const res = await api.post(`/incidents/${id}/resolve`, data);
    return res.data;
  },

  remediate: async (
    id: string,
    actionId?: string,
  ): Promise<{
    success: boolean;
    incident: Incident;
    message: string;
    remediation: Record<string, unknown>;
  }> => {
    const res = await api.post(`/incidents/${id}/remediate`, { action_id: actionId });
    return res.data;
  },

  getActivity: async (id: string): Promise<{ activity: IncidentActivity[] }> => {
    const res = await api.get(`/incidents/${id}/activity`);
    return res.data;
  },
};

// ============================================================
// Knowledge API
// ============================================================

export const knowledgeApi = {
  list: async (params?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<{ articles: KnowledgeArticle[] }> => {
    const res = await api.get('/knowledge', { params });
    return res.data;
  },

  get: async (id: string): Promise<{ article: KnowledgeArticle }> => {
    const res = await api.get(`/knowledge/${id}`);
    return res.data;
  },
};
