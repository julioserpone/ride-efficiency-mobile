import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import {
  PLANS,
  type PremiumFeature,
} from '@/features/premium/premium-config';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';
import { useLanguage } from '@/lib/i18n';

const ORDERED_FEATURES: PremiumFeature[] = [
  'trends',
  'efficiency',
  'breakdown',
  'photos',
  'export',
  'multiVehicle',
];

/**
 * Paywall.
 *
 * The MVP ships the full pricing experience without a store integration: the
 * purchase button explains what is missing instead of pretending to charge.
 * Wiring RevenueCat / StoreKit here is the only remaining step for billing.
 */
export default function PaywallScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);

  const startCheckout = () => {
    Alert.alert(
      t('premium.notConnected'),
      t('premium.unavailable'),
      [{ text: t('premium.close') }],
    );
  };

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.crown, { backgroundColor: colors.primary }]}>
              <SymbolView name="crown.fill" size={24} tintColor="#FFFFFF" />
            </View>
            <AppText variant="title" style={styles.centered}>
              Ride Efficiency Premium
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.centered}>
              {t('premium.subtitle')}
            </AppText>
          </View>

          <GlassSurface style={styles.features}>
            {ORDERED_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <SymbolView name="checkmark.circle.fill" size={16} tintColor={colors.profit} />
                <View style={styles.featureText}>
                  <AppText variant="label">{t(`premium.feature.${feature === 'trends' ? 'trends' : feature === 'photos' ? 'photos' : 'efficiency'}.title`)}</AppText>
                  <AppText variant="caption" tone="muted">
                    {t(`premium.feature.${feature === 'trends' ? 'trends' : feature === 'photos' ? 'photos' : 'efficiency'}.description`)}
                  </AppText>
                </View>
              </View>
            ))}
          </GlassSurface>

          <View style={styles.plans}>
            {PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlan;

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={styles.planPressable}
                >
                  <GlassSurface
                    style={[
                      styles.plan,
                      isSelected && { borderColor: colors.primary, borderWidth: 1.5 },
                    ]}
                    tinted={isSelected}
                  >
                    <View style={styles.planHeader}>
                      <AppText variant="label">{plan.title}</AppText>
                      {plan.badge ? (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                          <AppText variant="caption" style={styles.badgeText}>
                            {plan.badge}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="title" numeric>
                      {plan.price}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {plan.note}
                    </AppText>
                  </GlassSurface>
                </Pressable>
              );
            })}
          </View>

          <Button label={t('premium.upgrade')} icon="sparkles" onPress={startCheckout} />
          <Button label={t('premium.close')} variant="ghost" onPress={() => router.back()} />

          <AppText variant="caption" tone="faint" style={styles.centered}>
            Cancel anytime from the App Store or Google Play. Prices shown in USD.
          </AppText>
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  crown: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  features: { padding: Spacing.lg, gap: Spacing.lg },
  featureRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  featureText: { flex: 1, gap: 2 },
  plans: { flexDirection: 'row', gap: Spacing.md },
  planPressable: { flex: 1 },
  plan: { padding: Spacing.lg, gap: Spacing.xs },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: { color: '#FFFFFF' },
});
