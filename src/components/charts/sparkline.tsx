import { StyleSheet, View } from 'react-native';
import { Radius } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type SparklineProps = {
  values: number[];
  height?: number;
  /** Colour of the last (current) column, used to flag a negative trend. */
  highlightLast?: boolean;
};

/**
 * Tiny trend strip. Each sample is a slim vertical bar, so no SVG surface or
 * chart dependency is needed for the dashboard's "last periods" glance.
 */
export function Sparkline({ values, height = 44, highlightLast = false }: SparklineProps) {
  const colors = useColors();

  if (values.length === 0) {
    return <View style={{ height }} />;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - Math.min(min, 0) || 1;

  return (
    <View style={[styles.root, { height }]}>
      {values.map((value, index) => {
        const isLast = index === values.length - 1;
        const isNegative = value < 0;
        const barHeight = Math.max(3, (Math.abs(value) / span) * height);

        return (
          <View
            key={index}
            style={{
              flex: 1,
              height: barHeight,
              borderRadius: Radius.sm / 2,
              backgroundColor: isNegative
                ? colors.loss
                : isLast && highlightLast
                  ? colors.neutral
                  : colors.primary,
              opacity: isLast ? 1 : 0.45,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
});
