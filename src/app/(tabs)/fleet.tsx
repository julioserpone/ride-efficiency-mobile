import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { countries, energyInvoices, rideTrips, vehicles } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatKm, toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import type { Country, EnergyType, EnergyUnit, RideTrip, Vehicle } from '@/lib/types';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const ENERGY_TYPES: { value: EnergyType; label: 'fleet.regularGasoline' | 'fleet.premiumGasoline' | 'fleet.diesel' | 'fleet.ethanol' | 'fleet.lpg' | 'fleet.cng' | 'fleet.electric' }[] = [
  { value: 'regular_gasoline', label: 'fleet.regularGasoline' },
  { value: 'premium_gasoline', label: 'fleet.premiumGasoline' },
  { value: 'diesel', label: 'fleet.diesel' },
  { value: 'ethanol', label: 'fleet.ethanol' },
  { value: 'lpg', label: 'fleet.lpg' },
  { value: 'cng', label: 'fleet.cng' },
  { value: 'electric', label: 'fleet.electric' },
];

export default function FleetScreen() {
  const { token } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [tripList, setTripList] = useState<RideTrip[]>([]);
  const [hasMatchingEnergyInvoice, setHasMatchingEnergyInvoice] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [energyType, setEnergyType] = useState<EnergyType>('regular_gasoline');
  const [vehicleName, setVehicleName] = useState('');
  const [economy, setEconomy] = useState('');
  const [commission, setCommission] = useState('');
  const [platform, setPlatform] = useState('');
  const [fare, setFare] = useState('');
  const [distance, setDistance] = useState('');
  const [deadhead, setDeadhead] = useState('');
  const [duration, setDuration] = useState('');
  const [energyPrice, setEnergyPrice] = useState('');
  const [tripDetail, setTripDetail] = useState<RideTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const localizedEnergyTypes = ENERGY_TYPES.map((item) => ({ ...item, label: t(item.label) }));

  const energyUnit: EnergyUnit = energyType === 'electric' ? 'kwh' : 'litres';
  const country = countryList.find((item) => item.id === selectedCountry);
  const vehicle = vehicleList.find((item) => item.id === selectedVehicle);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      countries.list(token),
      vehicles.list(token),
      rideTrips.list(token),
      energyInvoices.list(token),
    ]);
    const [countryResult, vehicleResult, tripResult, invoiceResult] = results;
    const errors: string[] = [];
    if (countryResult.status === 'fulfilled') {
      setCountryList(countryResult.value.countries);
      setSelectedCountry((current) => current ?? countryResult.value.countries[0]?.id ?? null);
    } else errors.push('countries');
    if (vehicleResult.status === 'fulfilled') {
      setVehicleList(vehicleResult.value.vehicles.data);
      setSelectedVehicle((current) => current ?? vehicleResult.value.vehicles.data[0]?.id ?? null);
    } else errors.push('vehicles');
    if (tripResult.status === 'fulfilled') setTripList(tripResult.value.trips.data);
    else errors.push('trips');
    if (invoiceResult.status === 'fulfilled') {
      const activeCountryId = selectedCountry ?? (countryResult.status === 'fulfilled' ? countryResult.value.countries[0]?.id : null);
      setHasMatchingEnergyInvoice(invoiceResult.value.invoices.data.some((invoice) =>
        invoice.status === 'completed' && invoice.country_id === activeCountryId && invoice.energy_type === energyType,
      ));
    } else errors.push('energy invoices');
    if (errors.length) setError(t('fleet.loadError', { modules: errors.join(', ') }));
    setLoading(false);
  }, [energyType, selectedCountry, t, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const createVehicle = async () => {
    if (!token || !selectedCountry || !vehicleName.trim() || Number(economy) <= 0) return;
    setSavingVehicle(true);
    setNotice(null);
    setError(null);
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
      setSelectedVehicle(result.vehicle.id);
      setVehicleName(''); setEconomy(''); setCommission('');
      setNotice(t('fleet.addedVehicle', { name: result.vehicle.name }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('fleet.addError'));
    } finally { setSavingVehicle(false); }
  };

  const calculateTrip = async () => {
    if (!token || !selectedVehicle || !platform.trim() || Number(fare) < 0 || Number(distance) <= 0) return;
    setSavingTrip(true);
    setNotice(null);
    setError(null);
    try {
      const result = await rideTrips.create(token, selectedVehicle, {
        platform_name: platform.trim(),
        gross_fare: Number(fare),
        distance_km: Number(distance),
        ...(deadhead ? { deadhead_distance_km: Number(deadhead) } : {}),
        ...(duration ? { duration_minutes: Number(duration) } : {}),
        ...(commission ? { commission_rate: Number(commission) } : {}),
        ...(energyPrice ? { energy_price_per_unit: Number(energyPrice) } : {}),
      });
      setTripDetail(result.trip);
      setTripList((current) => [result.trip, ...current]);
      setNotice(t('fleet.tripCalculated', { amount: formatCurrency(result.trip.net_profit, result.trip.currency_code) }));
      setPlatform(''); setFare(''); setDistance(''); setDeadhead(''); setDuration(''); setEnergyPrice('');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('fleet.tripError'));
    } finally { setSavingTrip(false); }
  };

  const openTrip = async (trip: RideTrip) => {
    if (!token) return;
    try { setTripDetail((await rideTrips.show(token, trip.id)).trip); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : t('fleet.detailsError')); }
  };

  return (
    <Screen title={t('fleet.title')} subtitle={t('fleet.subtitle')} contentStyle={styles.screen}>
      {error ? <AppText variant="caption" tone="loss">{error}</AppText> : null}
      {notice ? <AppText variant="caption" tone="profit">{notice}</AppText> : null}
      <SectionCard title={t('profile.fleet')} subtitle={vehicleList.length === 1 ? t('fleet.vehicleCountOne') : t('fleet.vehicleCount', { count: vehicleList.length })} padded={false}>
        {loading ? <AppText variant="caption" tone="muted">{t('fleet.loading')}</AppText> : vehicleList.length === 0 ? (
          <EmptyState message={t('fleet.noVehicles')} hint={t('fleet.noVehiclesHint')} />
        ) : vehicleList.map((item) => (
          <ListRow key={item.id} icon={item.energy_type === 'electric' ? 'bolt.fill' : 'car.fill'} title={item.name}
            subtitle={t('fleet.details')}
            value={item.commission_rate ? `${toNumber(item.commission_rate)}% fee` : undefined}
            accessory={selectedVehicle === item.id ? <SymbolView name="checkmark.circle.fill" size={20} tintColor={colors.primary} /> : undefined}
            onPress={() => setSelectedVehicle(item.id)} />
        ))}
      </SectionCard>

      <SectionCard title="Add a vehicle" subtitle="Set its energy consumption and platform fee">
        <View style={styles.pills}>{countryList.map((item) => <Choice key={item.id} label={item.code} active={selectedCountry === item.id} onPress={() => setSelectedCountry(item.id)} />)}</View>
        <Field label={t('fleet.vehicleName')} value={vehicleName} onChangeText={setVehicleName} placeholder="e.g. Toyota Corolla 2022" />
        <AppText variant="caption" tone="muted">{t('fleet.energyType')}</AppText>
        <View style={styles.pills}>{localizedEnergyTypes.map((item) => <Choice key={item.value} label={item.label} active={energyType === item.value} onPress={() => setEnergyType(item.value)} />)}</View>
        <Field label={t(energyUnit === 'kwh' ? 'fleet.economyKwh' : 'fleet.economyLitre')} value={economy} onChangeText={setEconomy} placeholder="12.5" keyboardType="decimal-pad" />
        <Field label={t('fleet.commission')} value={commission} onChangeText={setCommission} placeholder="20" keyboardType="decimal-pad" />
        <Button label={savingVehicle ? t('fleet.saving') : t('fleet.add')} icon="plus" loading={savingVehicle} disabled={!countryList.length || !vehicleName.trim() || Number(economy) <= 0} onPress={() => void createVehicle()} />
      </SectionCard>

      <SectionCard title={t('fleet.calculate')} subtitle={vehicle ? t('fleet.usingVehicle', { name: vehicle.name, currency: country?.currency_code ?? vehicle.country.currency_code }) : t('fleet.selectVehicle')}>
        {vehicleList.length === 0 ? <AppText variant="caption" tone="muted">{t('fleet.vehicleRequired')}</AppText> : <>
          <View style={styles.pills}>{vehicleList.map((item) => <Choice key={item.id} label={item.name} active={selectedVehicle === item.id} onPress={() => setSelectedVehicle(item.id)} />)}</View>
          <Field label={t('fleet.platform')} value={platform} onChangeText={setPlatform} placeholder="Uber, Lyft…" />
          <View style={styles.formRow}>
            <Field label={t('fleet.fare')} value={fare} onChangeText={setFare} placeholder="18.50" keyboardType="decimal-pad" />
            <Field label={t('fleet.distance')} value={distance} onChangeText={setDistance} placeholder="12.4" keyboardType="decimal-pad" />
          </View>
          <View style={styles.formRow}>
            <Field label={t('fleet.deadhead')} value={deadhead} onChangeText={setDeadhead} placeholder="0" keyboardType="decimal-pad" />
            <Field label={t('fleet.duration')} value={duration} onChangeText={setDuration} placeholder="25" keyboardType="number-pad" />
          </View>
          <Field label={t('fleet.energyOverride')} value={energyPrice} onChangeText={setEnergyPrice} placeholder={t('fleet.invoicePriceHint')} keyboardType="decimal-pad" />
          {!hasMatchingEnergyInvoice && !energyPrice ? <AppText variant="caption" tone="neutral">{t('fleet.noMatchingEnergy')}</AppText> : null}
          <Button label={savingTrip ? t('fleet.calculating') : t('fleet.calculateButton')} icon="function" loading={savingTrip} disabled={!selectedVehicle || !platform.trim() || Number(fare) < 0 || Number(distance) <= 0} onPress={() => void calculateTrip()} />
        </>}
      </SectionCard>

      {tripDetail ? <SectionCard title={t('fleet.latestCalculation')} subtitle={`${tripDetail.platform_name} · ${formatDate(tripDetail.created_at)}`}>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.netProfit')}</AppText><AppText variant="title" tone={toNumber(tripDetail.net_profit) >= 0 ? 'profit' : 'loss'}>{formatCurrency(tripDetail.net_profit, tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.grossFare')}</AppText><AppText variant="label">{formatCurrency(tripDetail.gross_fare, tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.costBreakdown')}</AppText><AppText variant="label">{formatCurrency(toNumber(tripDetail.energy_cost) + toNumber(tripDetail.commission_cost) + toNumber(tripDetail.depreciation_cost), tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.breakEven')}</AppText><AppText variant="label">{formatCurrency(tripDetail.break_even_fare, tripDetail.currency_code)} · {tripDetail.verdict}</AppText></View>
      </SectionCard> : null}

      <SectionCard title={t('fleet.recentRides')} subtitle={t('fleet.recentRidesSubtitle')} padded={false}>
        {loading ? <AppText variant="caption" tone="muted">Loading rides…</AppText> : tripList.length === 0 ? <EmptyState message={t('fleet.noRides')} hint={t('fleet.noRidesHint')} /> : tripList.map((trip) => (
          <ListRow key={trip.id} icon="car.side" title={`${trip.platform_name} · ${formatKm(trip.distance_km)}`} subtitle={`${formatDate(trip.created_at)} · ${trip.verdict}`} value={formatCurrency(trip.net_profit, trip.currency_code)} valueTone={toNumber(trip.net_profit) >= 0 ? 'profit' : 'loss'} onPress={() => void openTrip(trip)} />
        ))}
      </SectionCard>
    </Screen>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return <AppText onPress={onPress} variant="caption" style={[styles.choice, { color: active ? colors.primary : colors.inkMuted, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}>{label}</AppText>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'decimal-pad' | 'number-pad' }) {
  const colors = useColors();
  return <View style={styles.field}><AppText variant="caption" tone="muted">{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inkFaint} keyboardType={keyboardType ?? 'default'} style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>;
}
const styles = StyleSheet.create({
  screen: { gap: Spacing.lg },
  field: { flex: 1, gap: Spacing.xs },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  choice: { overflow: 'hidden', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  input: { height: 46, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, fontSize: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
});
