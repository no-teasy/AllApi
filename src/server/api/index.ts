import axios, { AxiosInstance } from 'axios';
import type {
  Provider,
  ProviderFormData,
  Model,
  ModelFormData,
  StatsSummary,
  ApiResponse,
} from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Provider API
export const providerApi = {
  list: async (): Promise<Provider[]> => {
    const response = await apiClient.get<ApiResponse<Provider[]>>('/providers');
    return response.data.data;
  },

  getById: async (id: string): Promise<Provider> => {
    const response = await apiClient.get<ApiResponse<Provider>>(`/providers/${id}`);
    return response.data.data;
  },

  create: async (data: ProviderFormData): Promise<Provider> => {
    const response = await apiClient.post<ApiResponse<Provider>>('/providers', data);
    return response.data.data;
  },

  update: async (id: string, data: ProviderFormData): Promise<Provider> => {
    const response = await apiClient.put<ApiResponse<Provider>>(`/providers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/providers/${id}`);
  },

  toggleEnabled: async (id: string, enabled: boolean): Promise<Provider> => {
    const response = await apiClient.patch<ApiResponse<Provider>>(`/providers/${id}`, { enabled });
    return response.data.data;
  },
};

// Model API
export const modelApi = {
  list: async (params?: { providerId?: string }): Promise<Model[]> => {
    const response = await apiClient.get<ApiResponse<Model[]>>('/models', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Model> => {
    const response = await apiClient.get<ApiResponse<Model>>(`/models/${id}`);
    return response.data.data;
  },

  create: async (data: ModelFormData): Promise<Model> => {
    const response = await apiClient.post<ApiResponse<Model>>('/models', data);
    return response.data.data;
  },

  update: async (id: string, data: ModelFormData): Promise<Model> => {
    const response = await apiClient.put<ApiResponse<Model>>(`/models/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/models/${id}`);
  },

  toggleEnabled: async (id: string, enabled: boolean): Promise<Model> => {
    const response = await apiClient.patch<ApiResponse<Model>>(`/models/${id}`, { enabled });
    return response.data.data;
  },
};

// Stats API
export const statsApi = {
  getSummary: async (): Promise<StatsSummary> => {
    const response = await apiClient.get<ApiResponse<StatsSummary>>('/stats/summary');
    return response.data.data;
  },

  getDailyStats: async (days: number = 7): Promise<StatsSummary['dailyStats']> => {
    const response = await apiClient.get<ApiResponse<StatsSummary['dailyStats']>>('/stats/daily', {
      params: { days },
    });
    return response.data.data;
  },

  getProviderStats: async (): Promise<StatsSummary['providerStats']> => {
    const response = await apiClient.get<ApiResponse<StatsSummary['providerStats']>>('/stats/providers');
    return response.data.data;
  },

  getModelStats: async (): Promise<StatsSummary['modelStats']> => {
    const response = await apiClient.get<ApiResponse<StatsSummary['modelStats']>>('/stats/models');
    return response.data.data;
  },
};

export default apiClient;
