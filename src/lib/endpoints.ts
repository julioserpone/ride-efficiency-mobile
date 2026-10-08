import { apiRequest } from '@/lib/api';
import type {
  ApiUser,
  CloseShiftPayload,
  EfficiencyResponse,
  FuelInvoiceListResponse,
  FuelInvoiceResponse,
  IssueTokenResponse,
  ShiftListResponse,
  ShiftResponse,
  StartShiftPayload,
  StatsSummaryResponse,
  WeeklyStatsResponse,
  MonthlyStatsResponse,
} from '@/lib/types';

/**
 * Typed wrappers around the `ride-efficiency-api` v1 endpoints. Keeping the
 * paths in one place means the screens never build URLs by hand.
 */

export const auth = {
  issueToken: (email: string, password: string, deviceName: string) =>
    apiRequest<IssueTokenResponse>('/auth/token', {
      method: 'POST',
      body: { email, password, device_name: deviceName },
    }),

  currentUser: (token: string) => apiRequest<{ user: ApiUser }>('/auth/user', { token }),

  revokeToken: (token: string) =>
    apiRequest<{ message: string }>('/auth/token', { method: 'DELETE', token }),
};

export const fuelInvoices = {
  list: (token: string) => apiRequest<FuelInvoiceListResponse>('/fuel-invoices', { token }),

  show: (token: string, id: number) =>
    apiRequest<FuelInvoiceResponse>(`/fuel-invoices/${id}`, { token }),

  create: (token: string, formData: FormData) =>
    apiRequest<FuelInvoiceResponse>('/fuel-invoices', {
      method: 'POST',
      token,
      formData,
    }),

  remove: (token: string, id: number) =>
    apiRequest<{ message: string }>(`/fuel-invoices/${id}`, { method: 'DELETE', token }),
};

export const shifts = {
  list: (token: string) => apiRequest<ShiftListResponse>('/shifts', { token }),

  show: (token: string, id: number) => apiRequest<ShiftResponse>(`/shifts/${id}`, { token }),

  start: (token: string, payload: StartShiftPayload) =>
    apiRequest<ShiftResponse>('/shifts', { method: 'POST', token, body: payload }),

  close: (token: string, id: number, payload: CloseShiftPayload) =>
    apiRequest<ShiftResponse>(`/shifts/${id}/close`, { method: 'POST', token, body: payload }),
};

export const stats = {
  summary: (token: string) => apiRequest<StatsSummaryResponse>('/stats/summary', { token }),

  weekly: (token: string) => apiRequest<WeeklyStatsResponse>('/stats/weekly', { token }),

  monthly: (token: string) => apiRequest<MonthlyStatsResponse>('/stats/monthly', { token }),

  efficiency: (token: string) => apiRequest<EfficiencyResponse>('/stats/efficiency', { token }),
};
