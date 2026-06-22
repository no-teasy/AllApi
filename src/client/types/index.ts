// Provider related types
export interface ProviderKey {
  id: string;
  key: string;
  enabled: boolean;
}

export interface ModelMapping {
  remoteModel: string;
  localModel: string;
}

export interface Provider {
  id: string;
  name: string;
  logo?: string;
  format: 'openai' | 'anthropic' | 'azure' | 'custom';
  baseURL: string;
  keys: ProviderKey[];
  models: ModelMapping[];
  weight: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Model related types
export interface Model {
  id: string;
  name: string;
  provider: string;
  icon?: string;
  inputPrice: number;
  outputPrice: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Stats related types
export interface DailyStats {
  date: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ProviderStats {
  providerId: string;
  providerName: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ModelStats {
  modelId: string;
  modelName: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface StatsSummary {
  totalProviders: number;
  totalModels: number;
  todayRequests: number;
  todayCost: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  dailyStats: DailyStats[];
  providerStats: ProviderStats[];
  modelStats: ModelStats[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Form types
export interface ProviderFormData {
  name: string;
  logo?: string;
  format: Provider['format'];
  baseURL: string;
  keys: ProviderKey[];
  models: ModelMapping[];
  weight: number;
  enabled: boolean;
}

export interface ModelFormData {
  name: string;
  provider: string;
  icon?: string;
  inputPrice: number;
  outputPrice: number;
  enabled: boolean;
}
