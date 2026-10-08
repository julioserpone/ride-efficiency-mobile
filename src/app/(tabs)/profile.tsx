import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ListRow } from '@/components/ui/list-row';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { usePremium } from '@/features/premium/use-premium';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Radius, Spacing } from '@/theme/tokens';
import { useAppTheme, useColors } from '@/theme/theme-provider';

/** Account screen: session, subscription entry point and app information. */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { mode } = useAppTheme();
  const colors = useColors();
  const { isPremium } = usePremium();

  const initials = (user?.name ?? 'R')
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'This device will be unlinked from your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen title="Account" subtitle="Plan, session and app details">
      <GlassSurface style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AppText variant="title" style={styles.avatarText}>
            {initials}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <AppText variant="heading">{user?.name ?? 'Driver'}</AppText>
          <AppText variant="caption" tone="muted">
            {user?.email ?? '—'}
          </AppText>
        </View>
        <PremiumBadge isPremium={isPremium} />
      </GlassSurface>

      <GlassSurface style={styles.upsell}>
        <SymbolView name="sparkles" size={20} tintColor={colors.primary} />
        <View style={styles.upsellText}>
          <AppText variant="label">
            {isPremium ? 'Premium is active' : 'Unlock the full analytics'}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isPremium
              ? 'Thanks for supporting the app. Every feature is unlocked.'
              : 'Trend charts, efficiency scorecards and receipt history.'}
          </AppText>
        </View>
        <Button
          label={isPremium ? 'Manage' : 'Upgrade'}
          variant={isPremium ? 'secondary' : 'primary'}
          fullWidth={false}
          onPress={() => router.push('/paywall')}
          style={styles.upsellButton}
        />
      </GlassSurface>

      <GlassSurface style={styles.card}>
        <ListRow icon="doc.text" title="Fuel invoices" subtitle="Your scanned receipts" onPress={() => router.push('/receipts')} />
        <ListRow icon="car" title="Shifts" subtitle="Daily profitability ledger" onPress={() => router.push('/shifts')} />
        <ListRow icon="chart.bar.xaxis" title="Statistics" subtitle="Fuel, spend and efficiency" onPress={() => router.push('/stats')} />
      </GlassSurface>

      <GlassSurface style={styles.card}>
        <ListRow
          icon="server.rack"
          title="API endpoint"
          subtitle={API_BASE_URL}
          valueTone="muted"
        />
        <ListRow
          icon={mode === 'dark' ? 'moon' : 'sun.max'}
          title="Appearance"
          subtitle={`Following system · ${mode}`}
        />
      </GlassSurface>

      <Button label="Sign out" icon="rectangle.portrait.and.arrow.right" variant="danger" onPress={confirmSignOut} />

      <AppText variant="caption" tone="faint" style={styles.version}>
        Ride Efficiency · version 1.0.0 (MVP)
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF' },
  heroText: { flex: 1, gap: 2 },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    flexWrap: 'wrap',
  },
  upsellText: { flex: 1, gap: 2, minWidth: 160 },
  upsellButton: { paddingHorizontal: Spacing.lg },
  card: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  version: { textAlign: 'center' },
});
