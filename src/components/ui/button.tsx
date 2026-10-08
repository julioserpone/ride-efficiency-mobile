import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: SymbolViewProps['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

/**
 * Pressable action used across the app. The primary variant is a solid brand
 * pill; the secondary one is a translucent surface that reads as glass on top
 * of the aurora background.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();
  const isInactive = disabled || loading;

  const background: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.glassFallback,
    ghost: 'transparent',
    danger: colors.loss,
  };

  const foreground: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.ink,
    ghost: colors.primary,
    danger: '#FFFFFF',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background[variant],
          borderColor: variant === 'secondary' ? colors.glassBorder : 'transparent',
        },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <SymbolView name={icon} size={16} tintColor={foreground[variant]} /> : null}
          <AppText variant="label" style={{ color: foreground[variant] }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  inactive: { opacity: 0.5 },
});
