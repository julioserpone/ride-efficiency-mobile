import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@/lib/auth-store';
import { useColors } from '@/theme/theme-provider';

/**
 * Bottom tab bar.
 *
 * `NativeTabs` renders the platform tab bar, so on iOS 26 it automatically
 * picks up the system Liquid Glass chrome and the correct safe-area insets —
 * a hand-rolled bar would have to reimplement both.
 *
 * The five destinations follow the driver's workflow: see today's numbers,
 * scan a receipt, review the numbers, browse shifts, manage the account.
 */
export default function TabsLayout() {
  const { token, isBootstrapping } = useAuth();
  const colors = useColors();

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
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gauge.with.dots.needle.50percent" drawable="ic_dashboard" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="receipts">
        <NativeTabs.Trigger.Label>Receipts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="doc.text.viewfinder" drawable="ic_receipts" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.xaxis" drawable="ic_stats" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shifts">
        <NativeTabs.Trigger.Label>Shifts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="car.fill" drawable="ic_shifts" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" drawable="ic_account" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
