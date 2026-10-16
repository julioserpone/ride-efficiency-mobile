import { BarChart } from '@/components/charts/bar-chart';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { PremiumGate } from '@/components/ui/premium-gate';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StatTile } from '@/components/ui/stat-tile';
import { AppText } from '@/components/ui/text';
import { usePremium } from '@/features/premium/use-premium';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/lib/auth-store';
import { stats } from '@/lib/endpoints';
import { formatCurrency, formatDuration, formatKm } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
  const { t } = useLanguage();
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
    <Screen title={t('stats.title')} subtitle={t('stats.subtitle')}>
      <SegmentedControl
        options={[
          { value: 'weekly', label: t('stats.weekly') },
          { value: 'monthly', label: t('stats.monthly') },
        ]}
        value={range}
        onChange={(value) => setRange(value as 'weekly' | 'monthly')}
      />

      <View style={styles.grid}>
        <StatTile
          label={t('stats.fuelSpend')}
          value={formatCurrency(totals?.total_fuel_cost)}
          hint={t('stats.allTime')}
          icon="fuelpump"
          tone="neutral"
        />
        <StatTile
          label={t('stats.fuelPerKm')}
          value={formatCurrency(fuelPerKm)}
          hint={t('stats.costPerKm')}
          icon="road.lanes"
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label={t('stats.profitPerKm')}
          value={formatCurrency(profitPerKm)}
          hint={t('stats.netEnergy')}
          icon="chart.line.uptrend.xyaxis"
          tone={profitPerKm >= 0 ? 'profit' : 'loss'}
        />
        <StatTile
          label={t('stats.depreciation')}
          value={formatCurrency(totals?.total_depreciation)}
          hint={t('stats.estimatedWear')}
          icon="wrench.and.screwdriver"
        />
      </View>

      <SectionCard title={t('stats.fuelSpend')} subtitle={t('stats.spendPeriod', { period: t(range === 'weekly' ? 'stats.week' : 'stats.month') })}>
        {series.length === 0 ? (
          <EmptyState message={t('stats.noSpend')} />
        ) : (
          <BarChart data={fuelBars} formatValue={(value) => formatCurrency(value, 'USD', null, { compact: true })} />
        )}
      </SectionCard>

      <PremiumGate
        feature="trends"
        isPremium={isPremium}
        unlocked={
          <SectionCard title={t('stats.profitTrend')} subtitle={t('stats.spendPeriod', { period: t(range === 'weekly' ? 'stats.week' : 'stats.month') })}>
            {series.length === 0 ? (
              <EmptyState message={t('stats.noShifts')} hint={t('stats.logShift')} />
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
          <SectionCard title={t('stats.efficiency')} subtitle={t('stats.hourEfficiency')}>
            <View style={styles.efficiencyGrid}>
              <MiniStat
                label={t('stats.profitHour')}
                value={formatCurrency(efficiency.data?.efficiency.profit_per_hour ?? 0)}
              />
              <MiniStat
                label={t('stats.minutesShift')}
                value={formatDuration(efficiency.data?.efficiency.avg_minutes_per_shift ?? 0)}
              />
              <MiniStat
                label={t('stats.kmShift')}
                value={formatKm(efficiency.data?.efficiency.avg_km_per_shift ?? 0)}
              />
              <MiniStat
                label={t('stats.profitPerKm')}
                value={formatCurrency(profitPerKm)}
              />
            </View>
            {summary.data?.best_shift ? (
              <View style={styles.bestRow}>
                <AppText variant="caption" tone="muted">
                  {t('stats.bestShift')}
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
