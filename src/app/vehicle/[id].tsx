import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ListRow } from '@/components/ui/list-row';
import { AppText } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-store';
import { vehicles } from '@/lib/endpoints';
import { toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import type { Vehicle } from '@/lib/types';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VehicleDetailScreen() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const result = await vehicles.list(token);
        const found = result.vehicles.data.find((v) => v.id === Number(id));
        if (isMounted) {
          if (found) {
            setVehicle(found);
          } else {
            setError(t('profile.vehicleNotFound'));
          }
        }
      } catch {
        if (isMounted) setError(t('profile.loadError'));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [token, id, t]);

  const deleteVehicle = () => {
    Alert.alert(
      t('profile.deleteVehicle'),
      t('profile.deleteVehicleConfirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming soon', 'Vehicle deletion will be available soon.');
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <GlassSurface style={styles.closeButtonGlass}>
              <SymbolView name="xmark" size={20} tintColor={colors.ink} />
            </GlassSurface>
          </TouchableOpacity>
          <AppText variant="heading">{t('profile.vehicleDetails')}</AppText>
          <View style={styles.closeButton} />
        </View>
        <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <AppText variant="caption" tone="muted">{t('profile.loading')}</AppText>
        </View>
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <GlassSurface style={styles.closeButtonGlass}>
              <SymbolView name="xmark" size={20} tintColor={colors.ink} />
            </GlassSurface>
          </TouchableOpacity>
          <AppText variant="heading">{t('profile.vehicleDetails')}</AppText>
          <View style={styles.closeButton} />
        </View>
        <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <EmptyState message={error ?? t('profile.vehicleNotFound')} hint={t('profile.tryAgain')} />
        </View>
      </View>
    );
  }

  const unit = vehicle.energy_unit === 'kwh' ? 'km/kWh' : `km/${vehicle.energy_unit === 'gallons' ? 'gal' : 'L'}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <GlassSurface style={styles.closeButtonGlass}>
            <SymbolView name="xmark" size={20} tintColor={colors.ink} />
          </GlassSurface>
        </TouchableOpacity>
        <AppText variant="heading">{vehicle.name}</AppText>
        <View style={styles.closeButton} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <SectionCard title={t('profile.vehicleInfo')} padded={false}>
          <ListRow icon="globe" title={t('profile.country')} subtitle={vehicle.country?.name ?? '—'} />
          <ListRow icon="bolt.fill" title={t('profile.energyType')} subtitle={vehicle.energy_type} />
          <ListRow icon="fuelpump" title={t('profile.economy')} subtitle={`${toNumber(vehicle.energy_economy)} ${unit}`} />
          {vehicle.commission_rate && (
            <ListRow icon="percent" title={t('profile.commission')} subtitle={`${toNumber(vehicle.commission_rate)}%`} />
          )}
          <ListRow icon={vehicle.is_active ? 'checkmark.circle.fill' : 'xmark.circle'} title={t('profile.status')} subtitle={vehicle.is_active ? t('profile.active') : t('profile.inactive')} />
        </SectionCard>

        <Button label={t('profile.deleteVehicle')} icon="trash" variant="danger" onPress={deleteVehicle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonGlass: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
});
