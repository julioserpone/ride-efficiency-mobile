import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type SectionCardProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Removes inner padding when the child manages its own (e.g. lists). */
  padded?: boolean;
};

/** Glass panel that groups related content on every screen. */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  style,
  padded = true,
}: SectionCardProps) {
  return (
    <GlassSurface style={[styles.card, style]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="heading">{title}</AppText>
            {subtitle ? (
              <AppText variant="caption" tone="muted">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      <View style={padded ? styles.body : undefined}>{children}</View>
    </GlassSurface>
  );
}

/** Empty/loading placeholder used by lists and charts. */
export function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <AppText variant="body" tone="muted" style={styles.emptyText}>
        {message}
      </AppText>
      {hint ? (
        <AppText variant="caption" tone="faint" style={styles.emptyText}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerText: { gap: Spacing.xs / 2, flexShrink: 1 },
  body: { gap: Spacing.md },
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyText: { textAlign: 'center' },
});
