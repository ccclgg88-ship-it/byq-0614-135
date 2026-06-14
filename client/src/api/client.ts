import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('currentUserId');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const api = {
  getPlans: () => apiClient.get<any, ApiResponse>('/plans'),
  getPlan: (type: string) => apiClient.get<any, ApiResponse>(`/plans/${type}`),

  getSubscription: (userId: string) =>
    apiClient.get<any, ApiResponse>(`/subscriptions/${userId}`),
  getSubscriptionPlan: (userId: string) =>
    apiClient.get<any, ApiResponse>(`/subscriptions/${userId}/plan`),
  cancelSubscription: (userId: string) =>
    apiClient.post<any, ApiResponse>(`/subscriptions/${userId}/cancel`),
  renewSubscription: (userId: string, planType: string) =>
    apiClient.post<any, ApiResponse>(`/subscriptions/${userId}/renew`, { planType }),

  createCheckout: (userId: string, planType: string) =>
    apiClient.post<any, ApiResponse>('/payments/checkout', { userId, planType }),
  getPaymentHistory: (userId: string) =>
    apiClient.get<any, ApiResponse>(`/payments/${userId}/history`),
  mockPay: (userId: string, planType: string) =>
    apiClient.post<any, ApiResponse>('/webhook/mock/success', { userId, planType }),

  getQuotaUsage: (userId: string) =>
    apiClient.get<any, ApiResponse>(`/quota/${userId}/usage`),
  getQuotaFlows: (userId: string, limit = 50, offset = 0) =>
    apiClient.get<any, ApiResponse>(`/quota/${userId}/flows`, {
      params: { limit, offset },
    }),
  getRollbackRecords: (userId: string, limit = 50) =>
    apiClient.get<any, ApiResponse>(`/quota/${userId}/rollbacks`, {
      params: { limit },
    }),
  syncQuota: (userId: string) =>
    apiClient.post<any, ApiResponse>(`/quota/${userId}/sync`),

  getRiskStatus: (userId: string) =>
    apiClient.get<any, ApiResponse>(`/risk/${userId}/status`),
  freezeUser: (userId: string, hours = 24) =>
    apiClient.post<any, ApiResponse>(`/risk/${userId}/freeze`, { hours }),
  unfreezeUser: (userId: string) =>
    apiClient.post<any, ApiResponse>(`/risk/${userId}/unfreeze`),
  getRiskLogs: (userId?: string, limit = 50) =>
    apiClient.get<any, ApiResponse>('/risk/logs', { params: { userId, limit } }),

  generateReconciliation: (period?: string) =>
    apiClient.post<any, ApiResponse>('/reconciliation/generate', { period }),
  getReconciliationReport: (period: string) =>
    apiClient.get<any, ApiResponse>(`/reconciliation/report/${period}`),
  getReconciliationHistory: (limit = 12) =>
    apiClient.get<any, ApiResponse>('/reconciliation/history', {
      params: { limit },
    }),
  getReconciliationDetail: (period: string, alertOnly = false, limit = 50) =>
    apiClient.get<any, ApiResponse>(`/reconciliation/report/${period}/detail`, {
      params: { alert: alertOnly ? 'true' : undefined, limit },
    }),
  downloadReconciliationCSV: (period: string) =>
    apiClient.get(`/reconciliation/report/${period}/csv`, {
      responseType: 'blob',
    }),

  sendMessage: (userId: string, content: string, messageId?: string) =>
    apiClient.post<any, ApiResponse>(
      '/message/send',
      { userId, content },
      {
        headers: messageId
          ? { 'X-Message-Id': messageId, 'X-Idempotency-Key': messageId }
          : undefined,
      }
    ),
};

export default apiClient;
