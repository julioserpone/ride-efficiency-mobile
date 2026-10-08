import { Text, type TextProps, type TextStyle } from 'react-native';
import { NumericStyle, Typography } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

type Variant = keyof typeof Typography;

export type AppTextProps = TextProps & {
  variant?: Variant;
  /** Semantic colour role resolved from the active theme. */
  tone?: 'default' | 'muted' | 'faint' | 'primary' | 'onImage' | 'profit' | 'neutral' | 'loss';
  /** Right-aligns digits with tabular figures for KPI values. */
  numeric?: boolean;
};

/** Single text primitive so typography and colour roles stay consistent. */
export function AppText({
  variant = 'body',
  tone = 'default',
  numeric = false,
  style,
  ...rest
}: AppTextProps) {
  const colors = useColors();

  const toneColor: Record<NonNullable<AppTextProps['tone']>, string> = {
    default: colors.ink,
    muted: colors.inkMuted,
    faint: colors.inkFaint,
    primary: colors.primary,
    onImage: colors.onImage,
    profit: colors.profit,
    neutral: colors.neutral,
    loss: colors.loss,
  };

  return (
    <Text
      style={[
        Typography[variant] as TextStyle,
        { color: toneColor[tone] },
        numeric ? NumericStyle : null,
        style,
      ]}
      {...rest}
    />
  );
}
