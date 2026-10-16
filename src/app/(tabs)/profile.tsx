import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ListRow } from '@/components/ui/list-row';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { usePremium } from '@/features/premium/use-premium';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useLanguage } from '@/lib/i18n';
import { useAppTheme, useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Alert, StyleSheet, View } from 'react-native';

/** Account screen: session, subscription entry point and app information. */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { mode } = useAppTheme();
  const colors = useColors();
  const { isPremium } = usePremium();
  const { language, setLanguage, t } = useLanguage();

  const initials = (user?.name ?? 'R')
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const confirmSignOut = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutMessage'), [
      { text: t('profile.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <GlassSurface style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AppText variant="title" style={styles.avatarText}>
            {initials}
          </AppText>
        </View>
        <View style={styles.heroText}>
          <AppText variant="heading">{user?.name ?? t('profile.driver')}</AppText>
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
            {isPremium ? t('profile.premiumActive') : t('profile.featureTitle')}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isPremium
              ? t('profile.premiumThanks')
              : t('profile.featureText')}
          </AppText>
        </View>
        <Button
          label={isPremium ? t('profile.manage') : t('profile.upgrade')}
          variant={isPremium ? 'secondary' : 'primary'}
          fullWidth={false}
          onPress={() => router.push('/paywall')}
          style={styles.upsellButton}
        />
      </GlassSurface>

      <GlassSurface style={styles.card}>
        <ListRow icon="doc.text" title={t('profile.invoiceItem')} subtitle={t('profile.scannedReceipts')} onPress={() => router.push('/receipts')} />
        <ListRow icon="car.side" title={t('profile.vehicles')} subtitle={t('profile.vehiclesSubtitle')} onPress={() => router.push('/vehicles')} />
        <ListRow icon="point.topleft.down.curvedto.point.bottomright.up" title={t('profile.rideTrips')} subtitle={t('profile.rideTripsSubtitle')} onPress={() => router.push('/ride-trips')} />
        <ListRow icon="car" title={t('profile.shiftItem')} subtitle={t('profile.shiftSubtitle')} onPress={() => router.push('/shifts')} />
        <ListRow icon="chart.bar.xaxis" title={t('profile.statsItem')} subtitle={t('profile.statisticsSubtitle')} onPress={() => router.push('/stats')} />
      </GlassSurface>

      <GlassSurface style={styles.card}>
        <ListRow
          icon="server.rack"
          title={t('profile.apiStatus')}
          subtitle={API_BASE_URL}
          valueTone="muted"
        />
        <ListRow
          icon={mode === 'dark' ? 'moon' : 'sun.max'}
          title={t('profile.appearance')}
          subtitle={t('profile.appearanceStatus', { mode })}
        />
        <ListRow
          icon="globe"
          title={t('profile.language')}
          subtitle={language === 'es' ? 'Español' : 'English'}
          onPress={() => void setLanguage(language === 'es' ? 'en' : 'es')}
        />
      </GlassSurface>

      <Button label={t('profile.signOut')} icon="rectangle.portrait.and.arrow.right" variant="danger" onPress={confirmSignOut} />

      <AppText variant="caption" tone="faint" style={styles.version}>
        {t('profile.accountVersion')}
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
