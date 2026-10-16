/**
 * Response contracts of the ride-efficiency-api `/api/v1` endpoints.
 * Amounts arrive as decimal strings because the Eloquent models cast them with
 * `decimal:2`, so every numeric field is typed `number | string`.
 */

export type Numeric = number | string;

export type ApiUser = {
  id: number;
  name: string;
  email: string;
};

export type IssueTokenResponse = {
  token: string;
  token_type: string;
  user: ApiUser;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
};

export type FuelInvoiceStatus = 'pending' | 'processing' | 'review_required' | 'completed' | 'failed';
export type EnergyUnit = 'gallons' | 'litres' | 'kwh';
export type EnergyType = 'regular_gasoline' | 'premium_gasoline' | 'diesel' | 'ethanol' | 'lpg' | 'cng' | 'electric';

export type FuelInvoice = {
  id: number;
  user_id: number;
  image_path: string;
  country_id: number | null;
  energy_product_id: number | null;
  total_amount_paid: Numeric | null;
  energy_amount: Numeric | null;
  fuel_volume_units: Numeric | null;
  energy_unit: EnergyUnit | null;
  energy_type: EnergyType | null;
  unit_price: Numeric | null;
  currency_code: string | null;
  vendor_name: string | null;
  fuel_type: string | null;
  invoice_date: string | null;
  status: FuelInvoiceStatus;
  ocr_raw_text: string | null;
  created_at: string;
  updated_at: string;
};

export type FuelInvoiceListResponse = {
  invoices: Paginated<FuelInvoice>;
};

export type Country = {
  id: number;
  code: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
};

export type EnergyProduct = {
  id: number;
  code: string;
  name: string;
  energy_type: EnergyType;
  energy_unit: EnergyUnit;
};

export type Vehicle = {
  id: number;
  country_id: number;
  name: string;
  energy_type: EnergyType;
  energy_unit: EnergyUnit;
  energy_economy: Numeric;
  commission_rate: Numeric | null;
  is_active: boolean;
  country: Country;
};

export type RideTripVerdict = 'accept' | 'marginal' | 'reject';

export type RideTrip = {
  id: number;
  vehicle_id: number;
  daily_shift_id: number | null;
  platform_name: string;
  currency_code: string;
  gross_fare: Numeric;
  distance_km: Numeric;
  deadhead_distance_km: Numeric;
  duration_minutes: number | null;
  commission_rate: Numeric;
  energy_price_per_unit: Numeric;
  energy_cost: Numeric;
  commission_cost: Numeric;
  depreciation_cost: Numeric;
  other_costs: Numeric;
  net_profit: Numeric;
  break_even_fare: Numeric;
  verdict: RideTripVerdict;
  created_at: string;
  vehicle?: Vehicle;
};

export type EnergyInvoiceReviewPayload = {
  country_id: number;
  energy_type: EnergyType;
  energy_unit: EnergyUnit;
  energy_amount: number;
  unit_price: number;
  total_amount_paid?: number;
  energy_product_id?: number;
  fuel_type?: string;
  tax_rate?: number;
  invoice_date?: string;
};

export type CreateVehiclePayload = {
  country_id: number;
  name: string;
  energy_type: EnergyType;
  energy_unit: EnergyUnit;
  energy_economy: number;
  commission_rate?: number;
};

export type CreateRideTripPayload = {
  platform_name: string;
  gross_fare: number;
  distance_km: number;
  deadhead_distance_km?: number;
  duration_minutes?: number;
  commission_rate?: number;
  other_costs_per_trip?: number;
  daily_shift_id?: number;
  energy_price_per_unit?: number;
};

export type FuelInvoiceResponse = {
  message: string;
  invoice: FuelInvoice;
};

export type DailyEarning = {
  id: number;
  daily_shift_id: number;
  provider_name: string;
  gross_amount: Numeric;
};

export type DailyShift = {
  id: number;
  user_id: number;
  shift_date: string;
  total_km_gps: Numeric;
  total_minutes_connected: number;
  total_trips_completed: number;
  total_offers_scanned: number;
  applied_fuel_cost: Numeric;
  estimated_depreciation: Numeric;
  real_net_profit: Numeric;
  earnings?: DailyEarning[];
  created_at: string;
  updated_at: string;
};

export type ShiftListResponse = {
  summary: {
    total_shifts: number;
    total_net_profit: number;
    total_km_gps: number;
    total_trips_completed: number;
  };
  shifts: Paginated<DailyShift>;
};

export type ShiftResponse = {
  message?: string;
  shift: DailyShift;
};

export type WeeklyStat = {
  week_start: string;
  total_shifts: number;
  total_net_profit: number;
  total_km: number;
  total_fuel_cost: number;
  total_depreciation: number;
  total_trips: number;
  avg_daily_profit: number;
};

export type MonthlyStat = {
  month_start: string;
  total_shifts: number;
  total_net_profit: number;
  total_km: number;
  total_fuel_cost: number;
  total_depreciation: number;
  total_trips: number;
  avg_daily_profit: number;
};

export type WeeklyStatsResponse = { weekly: WeeklyStat[] };
export type MonthlyStatsResponse = { monthly: MonthlyStat[] };

export type StatsSummaryResponse = {
  totals: {
    total_shifts: number | null;
    total_net_profit: Numeric | null;
    total_km: Numeric | null;
    total_fuel_cost: Numeric | null;
    total_depreciation: Numeric | null;
    total_trips: Numeric | null;
    avg_daily_profit: Numeric | null;
    avg_daily_km: Numeric | null;
  };
  best_shift: Pick<
    DailyShift,
    'id' | 'shift_date' | 'real_net_profit' | 'total_trips_completed' | 'total_km_gps'
  > | null;
  worst_shift: Pick<
    DailyShift,
    'id' | 'shift_date' | 'real_net_profit' | 'total_trips_completed' | 'total_km_gps'
  > | null;
  current_month_profit: number;
};

export type EfficiencyResponse = {
  efficiency: {
    profit_per_km: number;
    profit_per_hour: number;
    fuel_cost_per_km: number;
    avg_km_per_shift: number;
    avg_minutes_per_shift: number;
  };
};

export type CloseShiftPayload = {
  total_km_gps?: number;
  total_minutes_connected?: number;
  total_trips_completed?: number;
  total_offers_scanned?: number;
  applied_fuel_cost?: number;
  estimated_depreciation?: number;
  earnings?: { provider_name: string; gross_amount: number }[];
};

export type StartShiftPayload = CloseShiftPayload & { shift_date?: string };
