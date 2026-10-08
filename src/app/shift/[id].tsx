import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/lib/auth-store';
import { shifts } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDuration, formatKm, toNumber } from '@/lib/format';
import { Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

/**
 * Shift detail — the profitability breakdown of a single day.
 *
 * Mirrors the calculation done by `CalculateShiftProfitabilityAction`:
 * net profit = gross earnings − applied fuel cost − depreciation.
 */
export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const colors = useColors();
  const shiftId = Number(id);

  const { data, error, isLoading } = useAsync(() => shifts.show(token!, shiftId), [token, shiftId]);
  const shift = data?.shift;

  const gross = (shift?.earnings ?? []).reduce(
    (sum, earning) => sum + toNumber(earning.gross_amount),
    0,
  );
  const netProfit = toNumber(shift?.real_net_profit);
  const netTone = netProfit >= 0 ? 'profit' : 'loss';

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <AppText variant="title" style={styles.title}>
              {shift ? formatDate(shift.shift_date) : 'Shift'}
            </AppText>
            <Button label="Close" variant="ghost" fullWidth={false} onPress={() => router.back()} />
          </View>

          {isLoading ? (
            <AppText variant="caption" tone="muted">
              Loading shift…
            </AppText>
          ) : error || !shift ? (
            <GlassSurface style={styles.card}>
              <AppText variant="heading">Shift unavailable</AppText>
              <AppText variant="caption" tone="loss">
                {error ?? 'This shift no longer exists.'}
              </AppText>
            </GlassSurface>
          ) : (
            <>
              <GlassSurface style={styles.hero}>
                <AppText variant="caption" tone="muted">
                  NET PROFIT
                </AppText>
                <AppText variant="display" numeric tone={netTone}>
                  {formatCurrency(shift.real_net_profit)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  after fuel and depreciation
                </AppText>
              </GlassSurface>

              <GlassSurface style={styles.card}>
                <Line label="Gross earnings" value={formatCurrency(gross)} />
                <Line label="Fuel applied" value={`− ${formatCurrency(shift.applied_fuel_cost)}`} />
                <Line
                  label="Depreciation"
                  value={`− ${formatCurrency(shift.estimated_depreciation)}`}
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Line label="Net profit" value={formatCurrency(shift.real_net_profit)} tone={netTone} />
              </GlassSurface>

              <GlassSurface style={styles.card}>
                <Line label="Distance" value={formatKm(shift.total_km_gps)} />
                <Line
                  label="Connected time"
                  value={formatDuration(shift.total_minutes_connected)}
                />
                <Line label="Trips completed" value={String(shift.total_trips_completed)} />
                <Line label="Offers scanned" value={String(shift.total_offers_scanned)} />
                {toNumber(shift.total_km_gps) > 0 ? (
                  <Line
                    label="Profit per km"
                    value={formatCurrency(netProfit / toNumber(shift.total_km_gps))}
                  />
                ) : null}
              </GlassSurface>

              {(shift.earnings ?? []).length > 0 ? (
                <GlassSurface style={styles.card}>
                  <AppText variant="label">Earnings per platform</AppText>
                  {(shift.earnings ?? []).map((earning) => (
                    <Line
                      key={earning.id}
                      label={earning.provider_name}
                      value={formatCurrency(earning.gross_amount)}
                    />
                  ))}
                </GlassSurface>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

function Line({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'profit' | 'loss';
}) {
  return (
    <View style={styles.line}>
      <AppText variant="caption" tone="muted" style={styles.lineLabel}>
        {label}
      </AppText>
      <AppText variant="label" numeric tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexShrink: 1 },
  hero: { padding: Spacing.lg, gap: Spacing.xs, alignItems: 'center' },
  card: { padding: Spacing.lg, gap: Spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lineLabel: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.xs },
});
