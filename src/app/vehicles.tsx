import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { countries, vehicles } from '@/lib/endpoints';
import { useLanguage } from '@/lib/i18n';
import type { Country, EnergyType, EnergyUnit, Vehicle } from '@/lib/types';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

const ENERGY_TYPES: { value: EnergyType; labelKey: string }[] = [
  { value: 'regular_gasoline', labelKey: 'fleet.regularGasoline' },
  { value: 'premium_gasoline', labelKey: 'fleet.premiumGasoline' },
  { value: 'diesel', labelKey: 'fleet.diesel' },
  { value: 'ethanol', labelKey: 'fleet.ethanol' },
  { value: 'lpg', labelKey: 'fleet.lpg' },
  { value: 'cng', labelKey: 'fleet.cng' },
  { value: 'electric', labelKey: 'fleet.electric' },
];

export default function VehiclesScreen() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [energyType, setEnergyType] = useState<EnergyType>('regular_gasoline');
  const [vehicleName, setVehicleName] = useState('');
  const [economy, setEconomy] = useState('');
  const [commission, setCommission] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const energyUnit: EnergyUnit = energyType === 'electric' ? 'kwh' : 'litres';
  const localizedEnergyTypes = ENERGY_TYPES.map((item) => ({ ...item, label: t(item.labelKey) }));

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([countries.list(token), vehicles.list(token)]);
    const [countryResult, vehicleResult] = results;
    if (countryResult.status === 'fulfilled') {
      setCountryList(countryResult.value.countries);
      setSelectedCountry((current) => current ?? countryResult.value.countries[0]?.id ?? null);
    } else {
      setError(countryResult.reason instanceof ApiError ? countryResult.reason.message : t('fleet.loadError', { modules: t('profile.countries') }));
    }
    if (vehicleResult.status === 'fulfilled') {
      setVehicleList(vehicleResult.value.vehicles.data);
    } else {
      setError(vehicleResult.reason instanceof ApiError ? vehicleResult.reason.message : t('fleet.loadError', { modules: t('profile.vehicles') }));
    }
    setLoading(false);
  }, [t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const createVehicle = async () => {
    if (!token || !selectedCountry || !vehicleName.trim() || Number(economy) <= 0) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await vehicles.create(token, {
        country_id: selectedCountry,
        name: vehicleName.trim(),
        energy_type: energyType,
        energy_unit: energyUnit,
        energy_economy: Number(economy),
        ...(commission ? { commission_rate: Number(commission) } : {}),
      });
      setVehicleList((current) => [result.vehicle, ...current]);
      setVehicleName('');
      setEconomy('');
      setCommission('');
      setNotice(t('fleet.addedVehicle', { name: result.vehicle.name }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('fleet.addError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t('fleet.vehiclesTitle')} subtitle={t('fleet.vehiclesSubtitle')} contentStyle={styles.screen}>
      {error ? <AppText variant="caption" tone="loss">{error}</AppText> : null}
      {notice ? <AppText variant="caption" tone="profit">{notice}</AppText> : null}
      <SectionCard title={t('profile.vehicles')} subtitle={t('fleet.vehicleCount', { count: vehicleList.length })} padded={false}>
        {loading ? <AppText variant="caption" tone="muted">{t('fleet.loading')}</AppText> : vehicleList.length === 0 ? (
          <EmptyState message={t('fleet.noVehicles')} hint={t('fleet.noVehiclesHint')} />
        ) : vehicleList.map((vehicle) => (
          <ListRow key={vehicle.id} icon={vehicle.energy_type === 'electric' ? 'bolt.fill' : 'car.fill'}
          title={vehicle.name}
          subtitle={vehicleDetails(vehicle, localizedEnergyTypes.find((item) => item.value === vehicle.energy_type)?.label ?? vehicle.energy_type)}
          value={vehicle.commission_rate ? `${Number(vehicle.commission_rate)}%` : undefined} />
        ))}
      </SectionCard>

      <SectionCard title={t('fleet.addVehicle')} subtitle={t('fleet.addSubtitle')}>
        <AppText variant="caption" tone="muted">{t('receipt.country')}</AppText>
        <View style={styles.pills}>{countryList.map((country) => <Choice key={country.id} label={country.code} active={selectedCountry === country.id} onPress={() => setSelectedCountry(country.id)} />)}</View>
        <Field label={t('fleet.vehicleName')} value={vehicleName} onChangeText={setVehicleName} placeholder={t('fleet.vehiclePlaceholder')} />
        <AppText variant="caption" tone="muted">{t('fleet.energyType')}</AppText>
        <View style={styles.pills}>{localizedEnergyTypes.map((item) => <Choice key={item.value} label={item.label} active={energyType === item.value} onPress={() => setEnergyType(item.value)} />)}</View>
        <Field label={t(energyUnit === 'kwh' ? 'fleet.economyKwh' : 'fleet.economyLitre')} value={economy} onChangeText={setEconomy} placeholder="12.5" keyboardType="decimal-pad" />
        <Field label={t('fleet.commission')} value={commission} onChangeText={setCommission} placeholder="20" keyboardType="decimal-pad" />
        <Button label={saving ? t('fleet.saving') : t('fleet.add')} icon="plus" loading={saving} disabled={!countryList.length || !vehicleName.trim() || Number(economy) <= 0} onPress={() => void createVehicle()} />
      </SectionCard>
    </Screen>
  );
}

function vehicleDetails(vehicle: Vehicle, energyLabel: string): string {
  const unit = vehicle.energy_unit === 'kwh' ? 'km/kWh' : `km/${vehicle.energy_unit === 'gallons' ? 'gal' : 'L'}`;
  return `${vehicle.country?.name ?? ''} · ${energyLabel} · ${Number(vehicle.energy_economy)} ${unit}`;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return <AppText onPress={onPress} variant="caption" style={[styles.choice, { color: active ? colors.primary : colors.inkMuted, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}>{label}</AppText>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'decimal-pad' | 'number-pad' }) {
  const colors = useColors();
  return <View style={styles.field}><AppText variant="caption" tone="muted">{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inkFaint} keyboardType={keyboardType ?? 'default'} style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>;
}
const styles = StyleSheet.create({ screen: { gap: Spacing.lg }, field: { gap: Spacing.xs }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }, choice: { overflow: 'hidden', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, input: { height: 46, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, fontSize: 16 } });
