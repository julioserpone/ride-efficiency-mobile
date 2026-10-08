import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { StatTile } from '@/components/ui/stat-tile';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/lib/auth-store';
import { shifts } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDuration, formatKm, toNumber } from '@/lib/format';
import { Spacing } from '@/theme/tokens';

/**
 * Shifts — the daily ledger.
 *
 * Each row is one `daily_shifts` record with its computed net profit, so the
 * driver can see which days actually paid after fuel and depreciation.
 */
export default function ShiftsScreen() {
  const { token } = useAuth();
  const { data, error, isLoading } = useAsync(() => shifts.list(token!), [token]);

  const summary = data?.summary;
  const rows = data?.shifts.data ?? [];
  const avgProfitPerShift =
    summary && summary.total_shifts > 0 ? toNumber(summary.total_net_profit) / summary.total_shifts : 0;

  return (
    <Screen
      title="Shifts"
      subtitle="Profit per day, after fuel and wear"
      contentStyle={styles.content}
    >
      <View style={styles.grid}>
        <StatTile
          label="Shifts"
          value={String(summary?.total_shifts ?? 0)}
          hint="logged"
          icon="calendar"
        />
        <StatTile
          label="Avg / shift"
          value={formatCurrency(avgProfitPerShift, 'USD', null, { compact: true })}
          hint="net profit"
          icon="chart.bar"
          tone={avgProfitPerShift >= 0 ? 'profit' : 'loss'}
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label="Distance"
          value={formatKm(summary?.total_km_gps)}
          hint="gps tracked"
          icon="road.lanes"
        />
        <StatTile
          label="Trips"
          value={String(summary?.total_trips_completed ?? 0)}
          hint="completed"
          icon="checkmark.circle"
        />
      </View>

      <Button
        label="Log a shift"
        icon="plus"
        variant="secondary"
        onPress={() => router.push('/shift/new')}
      />

      <SectionCard title="History" subtitle="Newest first" padded={false}>
        {isLoading ? (
          <AppText variant="caption" tone="muted">
            Loading shifts…
          </AppText>
        ) : rows.length === 0 ? (
          <EmptyState
            message="No shifts yet"
            hint="Log today's shift to start tracking your real profit."
          />
        ) : (
          rows.map((shift) => (
            <ListRow
              key={shift.id}
              icon="car"
              title={formatDate(shift.shift_date)}
              subtitle={`${formatKm(shift.total_km_gps)} · ${formatDuration(
                shift.total_minutes_connected,
              )} · fuel ${formatCurrency(shift.applied_fuel_cost, 'USD', null, { compact: true })}`}
              value={formatCurrency(shift.real_net_profit)}
              valueTone={toNumber(shift.real_net_profit) >= 0 ? 'profit' : 'loss'}
              onPress={() => router.push(`/shift/${shift.id}`)}
            />
          ))
        )}
      </SectionCard>

      {error ? (
        <AppText variant="caption" tone="loss">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.lg },
  grid: { flexDirection: 'row', gap: Spacing.md },
});
