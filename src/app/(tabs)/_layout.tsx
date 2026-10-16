import { useAuth } from '@/lib/auth-store';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

/** Five primary navigation destinations. Account contains secondary modules. */
export default function TabsLayout() {
  const { token, isBootstrapping } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();

  if (isBootstrapping) {
    return null;
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.primarySoft}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('nav.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gauge.with.dots.needle.50percent" drawable="ic_dashboard" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shifts">
        <NativeTabs.Trigger.Label>{t('nav.shifts')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="car.fill" drawable="ic_shifts" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="receipts">
        <NativeTabs.Trigger.Label>{t('nav.energy')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="doc.text.viewfinder" drawable="ic_receipts" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="fleet">
        <NativeTabs.Trigger.Label>{t('nav.fleet')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="car.2" drawable="ic_fleet" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>{t('nav.stats')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" drawable="ic_stats" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
