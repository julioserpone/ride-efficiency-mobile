import { Sparkline } from '@/components/charts/sparkline';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { StatTile } from '@/components/ui/stat-tile';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { useReceipts } from '@/hooks/use-receipts';
import { useAuth } from '@/lib/auth-store';
import { stats } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatKm, percentChange, toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

/**
 * Today — the driver's landing screen.
 *
 * Everything on it is free: this month's profit, the fuel spend and the last
 * three scanned receipts, plus the two actions a driver performs every day
 * (scan a receipt, log a shift).
 */
export default function DashboardScreen() {
  const { token, user } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();
  const summary = useAsync(() => stats.summary(token!), [token]);
  const weekly = useAsync(() => stats.weekly(token!), [token]);
  const receipts = useReceipts();


  const totals = summary.data?.totals;
  const monthProfit = summary.data?.current_month_profit ?? 0;
  const weeks = weekly.data?.weekly ?? [];
  const lastWeek = weeks.at(-1);
  const previousWeek = weeks.at(-2);
  const trend =
    lastWeek && previousWeek
      ? percentChange(lastWeek.total_net_profit, previousWeek.total_net_profit)
      : null;
  const fuelShare =
    totals && toNumber(totals.total_net_profit) + toNumber(totals.total_fuel_cost) !== 0
      ? (toNumber(totals.total_fuel_cost) /
          (toNumber(totals.total_net_profit) + toNumber(totals.total_fuel_cost))) *
        100
      : 0;

  return (
    <Screen
      title={t('home.greeting', { name: user?.name?.split(' ')[0] ?? t('profile.driver') })}
      subtitle={t('home.subtitle')}
      headerAccessory={<UserAvatar />}
    >
      <View style={styles.heroRow}>
        <StatTile
          label={t('home.month')}
          value={formatCurrency(monthProfit, 'USD', null, { compact: true })}
          hint={t('home.shiftsLogged', { count: totals?.total_shifts ?? 0 })}
          icon="calendar"
          tone={monthProfit >= 0 ? 'profit' : 'loss'}
          emphasis
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label={t('home.netProfit')}
          value={formatCurrency(totals?.total_net_profit)}
          hint={trend !== null ? t('home.vsLastWeek', { value: trend.toFixed(1) }) : t('home.noBaseline')}
          icon="chart.line.uptrend.xyaxis"
          tone={toNumber(totals?.total_net_profit) >= 0 ? 'profit' : 'loss'}
        />
        <StatTile
          label={t('home.energyCost')}
          value={formatCurrency(totals?.total_fuel_cost)}
          hint={t('home.revenueShare', { value: fuelShare.toFixed(0) })}
          icon="fuelpump"
          tone="neutral"
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label={t('home.distance')}
          value={formatKm(totals?.total_km)}
          hint={t('home.average', { value: formatKm(totals?.avg_daily_km) })}
          icon="road.lanes"
        />
        <StatTile
          label={t('home.trips')}
          value={String(Math.round(toNumber(totals?.total_trips)))}
          hint={t('home.completed')}
          icon="checkmark.circle"
        />
      </View>

      <SectionCard
        title={t('home.weeks')}
        subtitle={t('home.weekSubtitle')}
        action={
          <AppText variant="label" tone="primary" onPress={() => router.push('/stats')}>
            {t('home.viewStats')}
          </AppText>
        }
      >
        {weekly.isLoading ? (
          <AppText variant="caption" tone="muted">
            {t('home.loadingTrends')}
          </AppText>
        ) : weeks.length === 0 ? (
          <EmptyState
            message={t('home.noShifts')}
            hint={t('home.noShiftsHint')}
          />
        ) : (
          <>
            <View style={styles.chartContainer}>
              <Sparkline values={weeks.map((week) => week.total_net_profit)} height={64} />
            </View>
            <View style={styles.trendRow}>
              <AppText variant="caption" tone="faint">
                {formatDate(weeks[0]?.week_start)}
              </AppText>
              <AppText variant="caption" tone="faint">
                {formatDate(lastWeek?.week_start)}
              </AppText>
            </View>
          </>
        )}
      </SectionCard>

      <SectionCard
        title={t('home.recentInvoices')}
        subtitle={t('home.energyInvoices')}
        action={
          <AppText variant="label" tone="primary" onPress={() => router.push('/receipts')}>
            {t('home.seeAll')}
          </AppText>
        }
        padded={false}
      >
        {receipts.isLoading ? (
          <AppText variant="caption" tone="muted">
            {t('home.loadingReceipts')}
          </AppText>
        ) : receipts.invoices.length === 0 ? (
          <EmptyState message={t('home.noInvoices')} hint={t('home.noInvoicesHint')} />
        ) : (
          receipts.invoices.slice(0, 3).map((invoice) => (
            <ListRow
              key={invoice.id}
              icon="doc.text"
              title={invoice.fuel_type ?? 'Energy receipt'}
              subtitle={`${formatDate(invoice.invoice_date ?? invoice.created_at)}${
                invoice.energy_amount ? ` · ${toNumber(invoice.energy_amount)} ${invoice.energy_unit ?? ''}` : ''
              }`}
              value={formatCurrency(invoice.total_amount_paid)}
              onPress={() => router.push(`/receipt/${invoice.id}`)}
            />
          ))
        )}
      </SectionCard>

      <View style={styles.actions}>
        <Button
          label={t('home.scan')}
          icon="camera.viewfinder"
          onPress={() => router.push('/receipts')}
        />
        <Button
          label={t('home.logShift')}
          icon="plus"
          variant="secondary"
          onPress={() => router.push('/shift/new')}
        />
      </View>

      {summary.error ? (
        <AppText variant="caption" tone="loss">
          {summary.error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', gap: Spacing.md },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { gap: Spacing.sm },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chartContainer: { paddingVertical: Spacing.xs },
});
