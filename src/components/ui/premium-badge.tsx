import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

/** Small pill that marks the account tier in a screen header. */
export function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isPremium ? colors.primary : colors.surfaceMuted },
      ]}
    >
      <SymbolView
        name={isPremium ? 'checkmark.seal.fill' : 'leaf.fill'}
        size={12}
        tintColor={isPremium ? '#FFFFFF' : colors.inkMuted}
      />
      <AppText
        variant="caption"
        style={{ color: isPremium ? '#FFFFFF' : colors.inkMuted }}
      >
        {isPremium ? 'Premium' : 'Free plan'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
});
