import { View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { AppText } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-store';
import { usePremium } from '@/features/premium/use-premium';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export function UserAvatar({ size = 40 }: { size?: number }) {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const colors = useColors();

  const initials = (user?.name ?? 'R')
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={() => router.push('/account')}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary, width: size, height: size }]}>
        <AppText variant="label" style={[styles.avatarText, { fontSize: size * 0.4 }]}>
          {initials}
        </AppText>
      </View>
      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.profit }]}>
          <SymbolView name="star.fill" size={10} tintColor="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: Radius.pill,
    padding: 2,
  },
});
