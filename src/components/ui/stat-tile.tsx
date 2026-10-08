import { StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type StatTone = 'default' | 'profit' | 'neutral' | 'loss' | 'primary';

export type StatTileProps = {
  label: string;
  value: string;
  /** Secondary line: a comparison, a count or a unit. */
  hint?: string;
  icon?: SymbolViewProps['name'];
  tone?: StatTone;
  /** Renders wider, with the value in display size (used for the hero KPI). */
  emphasis?: boolean;
};

/** KPI tile: the repeating unit of the dashboard and stats screens. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  emphasis = false,
}: StatTileProps) {
  const colors = useColors();

  const toneColor: Record<StatTone, string> = {
    default: colors.ink,
    profit: colors.profit,
    neutral: colors.neutral,
    loss: colors.loss,
    primary: colors.primary,
  };

  return (
    <GlassSurface style={[styles.tile, emphasis && styles.tileEmphasis]}>
      <View style={styles.header}>
        {icon ? <SymbolView name={icon} size={14} tintColor={colors.inkMuted} /> : null}
        <AppText variant="caption" tone="muted" style={styles.label}>
          {label}
        </AppText>
      </View>
      <AppText
        variant={emphasis ? 'title' : 'heading'}
        numeric
        style={{ color: toneColor[tone] }}
      >
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" tone="faint" numeric>
          {hint}
        </AppText>
      ) : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  tileEmphasis: { padding: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  label: { flexShrink: 1, letterSpacing: 0.4, textTransform: 'uppercase' },
});
