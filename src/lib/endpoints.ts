import { apiRequest } from '@/lib/api';
import type {
  ApiUser,
  CloseShiftPayload,
  CreateRideTripPayload,
  CreateVehiclePayload,
  Country,
  EfficiencyResponse,
  EnergyInvoiceReviewPayload,
  EnergyProduct,
  FuelInvoiceListResponse,
  FuelInvoiceResponse,
  IssueTokenResponse,
  ShiftListResponse,
  ShiftResponse,
  StartShiftPayload,
  StatsSummaryResponse,
  WeeklyStatsResponse,
  MonthlyStatsResponse,
  RideTrip,
  Vehicle,
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

export const energyInvoices = {
  list: (token: string) => apiRequest<FuelInvoiceListResponse>('/energy-invoices', { token }),

  show: (token: string, id: number) =>
    apiRequest<FuelInvoiceResponse>(`/energy-invoices/${id}`, { token }),

  create: (token: string, formData: FormData) =>
    apiRequest<FuelInvoiceResponse>('/energy-invoices', {
      method: 'POST',
      token,
      formData,
    }),

  review: (token: string, id: number, payload: EnergyInvoiceReviewPayload) =>
    apiRequest<FuelInvoiceResponse>(`/energy-invoices/${id}/review`, {
      method: 'PATCH',
      token,
      body: payload,
    }),

  remove: (token: string, id: number) =>
    apiRequest<{ message: string }>(`/energy-invoices/${id}`, { method: 'DELETE', token }),
};

export const countries = {
  list: (token: string) => apiRequest<{ countries: Country[] }>('/countries', { token }),
  energyProducts: (token: string, countryCode: string) =>
    apiRequest<{ country: Pick<Country, 'code' | 'name'>; products: EnergyProduct[] }>(
      `/countries/${countryCode}/energy-products`,
      { token },
    ),
};

export const vehicles = {
  list: (token: string) => apiRequest<{ vehicles: { data: Vehicle[]; current_page: number; last_page: number; total: number } }>('/vehicles', { token }),
  create: (token: string, payload: CreateVehiclePayload) =>
    apiRequest<{ message: string; vehicle: Vehicle }>('/vehicles', { method: 'POST', token, body: payload }),
};

export const rideTrips = {
  list: (token: string) => apiRequest<{ trips: { data: RideTrip[]; current_page: number; last_page: number; total: number } }>('/ride-trips', { token }),
  show: (token: string, id: number) => apiRequest<{ trip: RideTrip }>(`/ride-trips/${id}`, { token }),
  create: (token: string, vehicleId: number, payload: CreateRideTripPayload) =>
    apiRequest<{ message: string; trip: RideTrip }>(`/vehicles/${vehicleId}/trips`, { method: 'POST', token, body: payload }),
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
