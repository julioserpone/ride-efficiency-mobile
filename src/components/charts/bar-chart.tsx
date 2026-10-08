import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type BarDatum = {
  label: string;
  value: number;
  /** Optional per-bar colour; defaults to the brand teal. */
  color?: string;
};

export type BarChartProps = {
  data: BarDatum[];
  /** Formats the value shown above the tallest bar in the label row. */
  formatValue?: (value: number) => string;
  height?: number;
};

/**
 * Dependency-free column chart.
 *
 * A charting library would add ~300 KB for two shapes; the analytics screens
 * only need columns and a sparkline, and drawing them with plain Views keeps
 * bundle size, startup time and the Liquid Glass surface count low.
 */
export function BarChart({ data, formatValue, height = 132 }: BarChartProps) {
  const colors = useColors();
  const values = data.map((datum) => datum.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const hasNegative = min < 0;
  const span = max - Math.min(min, 0) || 1;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.plot, { height }]}>
        {data.map((datum, index) => {
          const ratio = Math.abs(datum.value) / span;
          const barHeight = Math.max(3, ratio * (height - 18));
          const isNegative = datum.value < 0;

          return (
            <View key={`${datum.label}-${index}`} style={styles.column}>
              <AppText variant="caption" tone="faint" numeric style={styles.value}>
                {formatValue ? formatValue(datum.value) : Math.round(datum.value)}
              </AppText>
              <View
                style={{
                  height: barHeight,
                  width: '58%',
                  borderRadius: Radius.sm,
                  backgroundColor:
                    datum.color ?? (isNegative ? colors.loss : colors.primary),
                  opacity: hasNegative && isNegative ? 0.9 : 1,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((datum, index) => (
          <AppText
            key={`${datum.label}-label-${index}`}
            variant="caption"
            tone="faint"
            style={styles.label}
          >
            {datum.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  value: { fontSize: 10, fontVariant: ['tabular-nums'] },
  labels: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xs },
  label: { flex: 1, textAlign: 'center', fontSize: 10 },
});
