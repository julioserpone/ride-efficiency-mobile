import { useCallback, useMemo } from 'react';
import { PREMIUM_FEATURES, type PremiumFeature } from '@/features/premium/premium-config';

export type PremiumState = {
  isPremium: boolean;
  /** `true` when the current account can use the given feature. */
  canUse: (feature: PremiumFeature) => boolean;
  /** Copy for the paywall sheet describing a locked feature. */
  describe: (feature: PremiumFeature) => { title: string; description: string };
};

/**
 * Subscription gate for the UI.
 *
 * MVP: every account is on the free tier and `isPremium` is hard-coded, so the
 * paywall is fully wired and testable before billing exists. Swap the constant
 * for the entitlement returned by the API (or RevenueCat / StoreKit) and every
 * screen updates without further changes.
 */
export function usePremium(): PremiumState {
  const isPremium = false;

  const canUse = useCallback(
    (feature: PremiumFeature) => isPremium || isFreeFeature(feature),
    [isPremium],
  );

  return useMemo<PremiumState>(
    () => ({
      isPremium,
      canUse,
      describe: (feature) => PREMIUM_FEATURES[feature],
    }),
    [canUse, isPremium],
  );
}

/**
 * Newly captured receipts, the fuel spend summary and the shift list stay free
 * forever — the paywall covers the deeper analytics.
 */
function isFreeFeature(_feature: PremiumFeature): boolean {
  return false;
}
