import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import type { PremiumFeature } from '@/features/premium/premium-config';
import { usePremium } from '@/features/premium/use-premium';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';
import { useLanguage } from '@/lib/i18n';

export type PremiumGateProps = {
  feature: PremiumFeature;
  /** Rendered instead of the teaser when the account is entitled. */
  unlocked: React.ReactNode;
  isPremium?: boolean;
};

/**
 * Wraps premium-only content. Instead of hiding the feature entirely, the gate
 * renders a blurred-preview card with the real description and a single call to
 * action, so the driver sees the value before paying.
 */
export function PremiumGate({ feature, unlocked, isPremium }: PremiumGateProps) {
  const colors = useColors();
  const { t } = useLanguage();
  const account = usePremium();
  const featureKey = feature === 'trends' ? 'trends' : feature === 'photos' ? 'photos' : 'efficiency';
  const title = t(`premium.feature.${featureKey}.title`);
  const description = t(`premium.feature.${featureKey}.description`);
  const isUnlocked = isPremium ?? account.isPremium;

  if (isUnlocked) {
    return <>{unlocked}</>;
  }

  return (
    <GlassSurface style={styles.card} tinted>
      <View style={[styles.icon, { backgroundColor: colors.primary }]}>
        <SymbolView name="lock.fill" size={16} tintColor="#FFFFFF" />
      </View>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="caption" tone="muted" style={styles.description}>
        {description}
      </AppText>
      <AppText
        variant="label"
        tone="primary"
        onPress={() => router.push('/paywall')}
        accessibilityRole="button"
        style={styles.cta}
      >
        {t('premium.upgrade')} →
      </AppText>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { lineHeight: 18 },
  cta: { marginTop: Spacing.xs },
});
