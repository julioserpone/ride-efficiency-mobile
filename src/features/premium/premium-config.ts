/**
 * Single source of truth for what is free and what sits behind the
 * subscription. The app is free to install; the advanced analytics are the
 * paid tier. Nothing here talks to the API yet — when billing lands, only
 * `isPremium` needs to read the real entitlement.
 */

export type PremiumFeature =
  | 'trends'
  | 'efficiency'
  | 'breakdown'
  | 'photos'
  | 'export'
  | 'multiVehicle';

export type Plan = {
  id: 'monthly' | 'yearly';
  title: string;
  price: string;
  /** Secondary line shown under the price. */
  note: string;
  badge?: string;
};

export const PREMIUM_FEATURES: Record<PremiumFeature, { title: string; description: string }> = {
  trends: {
    title: 'Profit trends',
    description: 'Week-over-week and month-over-month profit, fuel and kilometre charts.',
  },
  efficiency: {
    title: 'Efficiency scorecard',
    description: 'Profit per km, profit per hour and fuel cost per km for every shift.',
  },
  breakdown: {
    title: 'Cost breakdown',
    description: 'See how much of your revenue goes to fuel, depreciation and wear.',
  },
  photos: {
    title: 'Receipt history with OCR detail',
    description: 'Browse every scanned receipt with its extracted litres, amount and date.',
  },
  export: {
    title: 'Export your data',
    description: 'Download a monthly CSV for your accountant or tax filing.',
  },
  multiVehicle: {
    title: 'Multiple vehicles',
    description: 'Track fuel and efficiency separately for each car you drive.',
  },
};

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$4.99',
    note: 'per month, cancel anytime',
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$39.99',
    note: 'per year — two months free',
    badge: 'Best value',
  },
];

/** Number of recent receipts a free account can browse. */
export const FREE_RECEIPT_HISTORY_LIMIT = 5;
