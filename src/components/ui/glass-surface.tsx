import { GlassContainer, GlassView, type GlassViewProps } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LIQUID_GLASS_AVAILABLE } from '@/lib/glass';
import { useColors } from '@/theme/theme-provider';
import { Radius } from '@/theme/tokens';

export type GlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius of the glass shape. */
  radius?: number;
  /** `regular` blurs the background, `clear` is nearly transparent. */
  variant?: 'regular' | 'clear';
  /** Tints the glass with the brand colour (used for selected pills). */
  tinted?: boolean;
  /** Lets the glass react to touches (native interactive highlight). */
  interactive?: boolean;
  /** Opt out of the elevation shadow on the fallback surface. */
  elevated?: boolean;
};

/**
 * Layered, translucent surface used for every card in the app.
 *
 * On iOS 26+ this renders a real Liquid Glass surface through
 * `expo-glass-effect`. Everywhere else it degrades to a translucent,
 * hairline-bordered surface so Android and older iOS keep the same layout and
 * hierarchy without pretending to be glass.
 */
export function GlassSurface({
  children,
  style,
  radius = Radius.lg,
  variant = 'regular',
  tinted = false,
  interactive = false,
  elevated = true,
}: GlassSurfaceProps) {
  const colors = useColors();
  const liquidGlass = LIQUID_GLASS_AVAILABLE;

  if (liquidGlass) {
    const glassProps: Partial<GlassViewProps> = {
      glassEffectStyle: variant,
      tintColor: tinted ? colors.primary : colors.glassTint,
      isInteractive: interactive,
    };

    return (
      <GlassView {...glassProps} style={[styles.base, { borderRadius: radius }, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        {
          borderRadius: radius,
          backgroundColor: tinted ? colors.primarySoft : colors.glassFallback,
          borderColor: tinted ? colors.primary : colors.glassBorder,
        },
        elevated && styles.elevated,
        elevated && { shadowColor: colors.shadow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Groups sibling glass surfaces so they can merge with each other, the way the
 * iOS 26 design language expects. Falls back to a plain container elsewhere.
 */
export function GlassSurfaceContainer({
  children,
  style,
  spacing = 0,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  spacing?: number;
}) {
  const liquidGlass = LIQUID_GLASS_AVAILABLE;

  if (liquidGlass) {
    return (
      <GlassContainer spacing={spacing} style={style}>
        {children}
      </GlassContainer>
    );
  }

  return <View style={style}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  elevated: {
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
});
