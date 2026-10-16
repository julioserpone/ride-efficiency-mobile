import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { UserAvatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-store';
import { vehicles } from '@/lib/endpoints';
import { formatCurrency, formatKm, toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { Vehicle } from '@/lib/types';

export default function VehicleDetailScreen() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { t } = useLanguage();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await vehicles.list(token);
      const found = result.vehicles.data.find((v) => v.id === Number(id));
      if (found) {
        setVehicle(found);
      } else {
        setError(t('profile.vehicleNotFound'));
      }
    } catch (e) {
      setError(t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  }, [token, id, t]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <Screen title={t('profile.vehicleDetails')} subtitle={t('profile.loading')} headerAccessory={<UserAvatar />}>
        <AppText variant="caption" tone="muted">{t('profile.loading')}</AppText>
      </Screen>
    );
  }

  if (error || !vehicle) {
    return (
      <Screen title={t('profile.vehicleDetails')} subtitle={t('profile.error')} headerAccessory={<UserAvatar />}>
        <EmptyState message={error ?? t('profile.vehicleNotFound')} hint={t('profile.tryAgain')} />
      </Screen>
    );
  }

  const unit = vehicle.energy_unit === 'kwh' ? 'km/kWh' : `km/${vehicle.energy_unit === 'gallons' ? 'gal' : 'L'}`;

  return (
    <Screen title={vehicle.name} subtitle={t('profile.vehicleDetails')} headerAccessory={<UserAvatar />}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({});
