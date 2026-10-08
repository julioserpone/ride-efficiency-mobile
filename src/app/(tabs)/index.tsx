import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

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
      title={`Hi, ${user?.name?.split(' ')[0] ?? 'driver'}`}
      subtitle="Your fuel and profit at a glance"
    >
      <View style={styles.heroRow}>
        <StatTile
          label="This month"
          value={formatCurrency(monthProfit, 'USD', null, { compact: true })}
          hint={`${totals?.total_shifts ?? 0} shifts logged`}
          icon="calendar"
          tone={monthProfit >= 0 ? 'profit' : 'loss'}
          emphasis
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label="Net profit"
          value={formatCurrency(totals?.total_net_profit)}
          hint={trend !== null ? `${trend.toFixed(1)}% vs last week` : 'no baseline yet'}
          icon="chart.line.uptrend.xyaxis"
          tone={toNumber(totals?.total_net_profit) >= 0 ? 'profit' : 'loss'}
        />
        <StatTile
          label="Fuel cost"
          value={formatCurrency(totals?.total_fuel_cost)}
          hint={`${fuelShare.toFixed(0)}% of revenue`}
          icon="fuelpump"
          tone="neutral"
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label="Distance"
          value={formatKm(totals?.total_km)}
          hint={`avg ${formatKm(totals?.avg_daily_km)}`}
          icon="road.lanes"
        />
        <StatTile
          label="Trips"
          value={String(Math.round(toNumber(totals?.total_trips)))}
          hint="completed"
          icon="checkmark.circle"
        />
      </View>

      <SectionCard
        title="Last 8 weeks"
        subtitle="Net profit per week"
        action={
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <AppText variant="caption" tone="muted">
              profit
            </AppText>
          </View>
        }
      >
        {weekly.isLoading ? (
          <AppText variant="caption" tone="muted">
            Loading trends…
          </AppText>
        ) : weeks.length === 0 ? (
          <EmptyState
            message="No shifts recorded yet"
            hint="Log your first shift to start seeing trends."
          />
        ) : (
          <>
            <Sparkline values={weeks.map((week) => week.total_net_profit)} height={64} />
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
        title="Recent receipts"
        subtitle="Fuel invoices you have scanned"
        action={
          <AppText variant="label" tone="primary" onPress={() => router.push('/receipts')}>
            See all
          </AppText>
        }
        padded={false}
      >
        {receipts.isLoading ? (
          <AppText variant="caption" tone="muted">
            Loading receipts…
          </AppText>
        ) : receipts.invoices.length === 0 ? (
          <EmptyState
            message="No fuel receipts yet"
            hint="Scan your first invoice to track fuel spend."
          />
        ) : (
          receipts.invoices.slice(0, 3).map((invoice) => (
            <ListRow
              key={invoice.id}
              icon="doc.text"
              title={invoice.fuel_type ?? 'Fuel receipt'}
              subtitle={`${formatDate(invoice.invoice_date ?? invoice.created_at)}${
                invoice.fuel_volume_units ? ` · ${toNumber(invoice.fuel_volume_units)} L` : ''
              }`}
              value={formatCurrency(invoice.total_amount_paid)}
              onPress={() => router.push(`/receipt/${invoice.id}`)}
            />
          ))
        )}
      </SectionCard>

      <View style={styles.actions}>
        <Button
          label="Scan a receipt"
          icon="camera.viewfinder"
          onPress={() => router.push('/receipts')}
        />
        <Button
          label="Log a shift"
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
});
