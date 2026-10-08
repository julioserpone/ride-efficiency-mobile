import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from '@/components/charts/bar-chart';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { PremiumGate } from '@/components/ui/premium-gate';
import { Screen } from '@/components/ui/screen';
import { StatTile } from '@/components/ui/stat-tile';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/lib/auth-store';
import { stats } from '@/lib/endpoints';
import { formatCurrency, formatDuration, formatKm } from '@/lib/format';
import { usePremium } from '@/features/premium/use-premium';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';
import { SegmentedControl } from '@/components/ui/segmented-control';

/**
 * Stats — fuel consumption, station spend and efficiency.
 *
 * The fuel spend, distance and trip totals are free; the trend charts, the
 * efficiency scorecard and the cost breakdown are the premium tier, which is
 * what the paywall sells.
 */
export default function StatsScreen() {
  const { token } = useAuth();
  const colors = useColors();
  const { isPremium } = usePremium();
  const [range, setRange] = useState<'weekly' | 'monthly'>('weekly');

  const weekly = useAsync(() => stats.weekly(token!), [token]);
  const monthly = useAsync(() => stats.monthly(token!), [token]);
  const summary = useAsync(() => stats.summary(token!), [token]);
  const efficiency = useAsync(() => stats.efficiency(token!), [token]);

  // Both endpoints expose the same shape under a different date key, so the
  // series is normalised once instead of branching on the union everywhere.
  const series: SeriesPoint[] =
    range === 'weekly'
      ? (weekly.data?.weekly ?? []).map((entry) => ({ ...entry, period: entry.week_start }))
      : (monthly.data?.monthly ?? []).map((entry) => ({ ...entry, period: entry.month_start }));
  const totals = summary.data?.totals;
  const fuelPerKm = efficiency.data?.efficiency.fuel_cost_per_km ?? 0;
  const profitPerKm = efficiency.data?.efficiency.profit_per_km ?? 0;

  const bars = series.map((entry) => ({
    label: labelFor(entry.period, range),
    value: entry.total_net_profit,
  }));

  const fuelBars = series.map((entry) => ({
    label: labelFor(entry.period, range),
    value: entry.total_fuel_cost,
    color: colors.neutral,
  }));

  const error = weekly.error ?? summary.error ?? efficiency.error;

  return (
    <Screen title="Stats" subtitle="Fuel, spend and efficiency over time">
      <SegmentedControl
        options={[
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        value={range}
        onChange={(value) => setRange(value as 'weekly' | 'monthly')}
      />

      <View style={styles.grid}>
        <StatTile
          label="Fuel spend"
          value={formatCurrency(totals?.total_fuel_cost)}
          hint="all time"
          icon="fuelpump"
          tone="neutral"
        />
        <StatTile
          label="Fuel / km"
          value={formatCurrency(fuelPerKm)}
          hint="cost per kilometre"
          icon="road.lanes"
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label="Profit / km"
          value={formatCurrency(profitPerKm)}
          hint="net of fuel + wear"
          icon="chart.line.uptrend.xyaxis"
          tone={profitPerKm >= 0 ? 'profit' : 'loss'}
        />
        <StatTile
          label="Depreciation"
          value={formatCurrency(totals?.total_depreciation)}
          hint="estimated wear"
          icon="wrench.and.screwdriver"
        />
      </View>

      <SectionCard title="Fuel spend" subtitle={`Per ${range === 'weekly' ? 'week' : 'month'}`}>
        {series.length === 0 ? (
          <EmptyState message="No fuel spend recorded yet" />
        ) : (
          <BarChart data={fuelBars} formatValue={(value) => formatCurrency(value, 'USD', null, { compact: true })} />
        )}
      </SectionCard>

      <PremiumGate
        feature="trends"
        isPremium={isPremium}
        unlocked={
          <SectionCard title="Net profit trend" subtitle={`Per ${range === 'weekly' ? 'week' : 'month'}`}>
            {series.length === 0 ? (
              <EmptyState message="No shifts recorded yet" hint="Log a shift to see the trend." />
            ) : (
              <BarChart
                data={bars}
                formatValue={(value) => formatCurrency(value, 'USD', null, { compact: true })}
              />
            )}
          </SectionCard>
        }
      />

      <PremiumGate
        feature="efficiency"
        isPremium={isPremium}
        unlocked={
          <SectionCard title="Efficiency" subtitle="How each hour of work pays off">
            <View style={styles.efficiencyGrid}>
              <MiniStat
                label="Profit / hour"
                value={formatCurrency(efficiency.data?.efficiency.profit_per_hour ?? 0)}
              />
              <MiniStat
                label="Minutes / shift"
                value={formatDuration(efficiency.data?.efficiency.avg_minutes_per_shift ?? 0)}
              />
              <MiniStat
                label="Km / shift"
                value={formatKm(efficiency.data?.efficiency.avg_km_per_shift ?? 0)}
              />
              <MiniStat
                label="Profit / km"
                value={formatCurrency(profitPerKm)}
              />
            </View>
            {summary.data?.best_shift ? (
              <View style={styles.bestRow}>
                <AppText variant="caption" tone="muted">
                  Best shift
                </AppText>
                <AppText variant="label" tone="profit" numeric>
                  {formatCurrency(summary.data.best_shift.real_net_profit)} ·{' '}
                  {formatKm(summary.data.best_shift.total_km_gps)}
                </AppText>
              </View>
            ) : null}
          </SectionCard>
        }
      />

      {error ? (
        <AppText variant="caption" tone="loss">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="heading" numeric>
        {value}
      </AppText>
    </View>
  );
}

/** One bucket of either series, normalised to a single `period` key. */
type SeriesPoint = {
  period: string;
  total_shifts: number;
  total_net_profit: number;
  total_km: number;
  total_fuel_cost: number;
  total_depreciation: number;
  total_trips: number;
  avg_daily_profit: number;
};

/** `2026-08-01` → `Aug 1`; monthly series use the short month only. */
function labelFor(date: string, range: 'weekly' | 'monthly'): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return range === 'weekly'
    ? `${parsed.getMonth() + 1}/${parsed.getDate()}`
    : parsed.toLocaleDateString('en-US', { month: 'short' });
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: Spacing.md },
  efficiencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  miniStat: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
