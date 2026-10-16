import { UserAvatar } from '@/components/ui/avatar';
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
import { useLanguage } from '@/lib/i18n';
import { Spacing } from '@/theme/tokens';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

/**
 * Shifts — the daily ledger.
 *
 * Each row is one `daily_shifts` record with its computed net profit, so the
 * driver can see which days actually paid after fuel and depreciation.
 */
export default function ShiftsScreen() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const { data, error, isLoading } = useAsync(() => shifts.list(token!), [token]);

  const summary = data?.summary;
  const rows = data?.shifts.data ?? [];
  const avgProfitPerShift =
    summary && summary.total_shifts > 0 ? toNumber(summary.total_net_profit) / summary.total_shifts : 0;

  return (
    <Screen
      title={t('shiftList.title')}
      subtitle={t('shiftList.subtitle')}
      contentStyle={styles.content}
      headerAccessory={<UserAvatar />}
    >
      <View style={styles.grid}>
        <StatTile
          label={t('shiftList.count')}
          value={String(summary?.total_shifts ?? 0)}
          hint={t('shiftList.logged')}
          icon="calendar"
        />
        <StatTile
          label={t('shiftList.avg')}
          value={formatCurrency(avgProfitPerShift, 'USD', null, { compact: true })}
          hint={t('shiftList.netProfit')}
          icon="chart.bar"
          tone={avgProfitPerShift >= 0 ? 'profit' : 'loss'}
        />
      </View>

      <View style={styles.grid}>
        <StatTile
          label={t('shiftList.distance')}
          value={formatKm(summary?.total_km_gps)}
          hint={t('shiftList.gps')}
          icon="road.lanes"
        />
        <StatTile
          label={t('shiftList.trips')}
          value={String(summary?.total_trips_completed ?? 0)}
          hint={t('shiftList.completed')}
          icon="checkmark.circle"
        />
      </View>

      <Button
        label={t('shiftList.log')}
        icon="plus"
        variant="secondary"
        onPress={() => router.push('/shift/new')}
      />

      <SectionCard title={t('shiftList.history')} subtitle={t('shiftList.newest')} padded={false}>
        {isLoading ? (
          <AppText variant="caption" tone="muted">
            {t('shiftList.loading')}
          </AppText>
        ) : rows.length === 0 ? (
          <EmptyState
            message={t('shiftList.empty')}
            hint={t('shiftList.emptyHint')}
          />
        ) : (
          rows.map((shift) => (
            <ListRow
              key={shift.id}
              icon="car"
              title={formatDate(shift.shift_date)}
              subtitle={t('shiftList.gpsFuel', { km: formatKm(shift.total_km_gps), duration: formatDuration(shift.total_minutes_connected), cost: formatCurrency(shift.applied_fuel_cost, 'USD', null, { compact: true })})}
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
