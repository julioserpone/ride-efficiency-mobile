import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned value, usually already formatted. */
  value?: string;
  valueTone?: 'default' | 'profit' | 'loss' | 'muted';
  icon?: SymbolViewProps['name'];
  onPress?: () => void;
  /** Trailing element that replaces the chevron (e.g. a status pill). */
  accessory?: React.ReactNode;
};

/** Dense, tappable row used by the receipt, shift and settings lists. */
export function ListRow({
  title,
  subtitle,
  value,
  valueTone = 'default',
  icon,
  onPress,
  accessory,
}: ListRowProps) {
  const colors = useColors();

  const toneColor = {
    default: colors.ink,
    profit: colors.profit,
    loss: colors.loss,
    muted: colors.inkMuted,
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView name={icon} size={15} tintColor={colors.primary} />
        </View>
      ) : null}
      <View style={styles.main}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" numeric style={{ color: toneColor[valueTone] }}>
          {value}
        </AppText>
      ) : null}
      {accessory}
      {onPress && !accessory ? (
        <SymbolView name="chevron.right" size={13} tintColor={colors.inkFaint} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pressed: { opacity: 0.6 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1, gap: 2 },
});
