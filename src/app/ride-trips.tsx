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
import { rideTrips, vehicles } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatKm, toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import type { RideTrip, Vehicle } from '@/lib/types';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export default function RideTripsScreen() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [tripList, setTripList] = useState<RideTrip[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [platform, setPlatform] = useState('');
  const [fare, setFare] = useState('');
  const [distance, setDistance] = useState('');
  const [deadhead, setDeadhead] = useState('');
  const [duration, setDuration] = useState('');
  const [commission, setCommission] = useState('');
  const [energyPrice, setEnergyPrice] = useState('');
  const [tripDetail, setTripDetail] = useState<RideTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vehicle = vehicleList.find((item) => item.id === selectedVehicle);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([vehicles.list(token), rideTrips.list(token)]);
    const [vehicleResult, tripResult] = results;
    const errors: string[] = [];
    if (vehicleResult.status === 'fulfilled') {
      setVehicleList(vehicleResult.value.vehicles.data);
      setSelectedVehicle((current) => current ?? vehicleResult.value.vehicles.data[0]?.id ?? null);
    } else errors.push('vehicles');
    if (tripResult.status === 'fulfilled') setTripList(tripResult.value.trips.data);
    else errors.push('ride trips');
    if (errors.length) setError(t('fleet.loadError', { modules: errors.join(', ') }));
    setLoading(false);
  }, [t, token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const calculate = async () => {
    if (!token || !selectedVehicle || !platform.trim() || Number(fare) < 0 || Number(distance) <= 0) return;
    setSaving(true);
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
      setPlatform(''); setFare(''); setDistance(''); setDeadhead(''); setDuration(''); setEnergyPrice('');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('fleet.tripError'));
    } finally { setSaving(false); }
  };

  const openTrip = async (trip: RideTrip) => {
    if (!token) return;
    try { setTripDetail((await rideTrips.show(token, trip.id)).trip); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : t('fleet.detailsError')); }
  };

  return (
    <Screen title={t('fleet.rideTrips')} subtitle={t('fleet.rideTripsSubtitle')} contentStyle={styles.screen}>
      {error ? <AppText variant="caption" tone="loss">{error}</AppText> : null}
      <SectionCard title={t('fleet.calculate')} subtitle={vehicle ? t('fleet.usingVehicle', { name: vehicle.name, currency: vehicle.country.currency_code }) : t('fleet.selectVehicle')}>
        {vehicleList.length === 0 ? <EmptyState message={t('fleet.noVehicles')} hint={t('fleet.vehicleRequired')} /> : <>
          <View style={styles.pills}>{vehicleList.map((item) => <Choice key={item.id} label={item.name} active={selectedVehicle === item.id} onPress={() => setSelectedVehicle(item.id)} />)}</View>
          <Field label={t('fleet.platform')} value={platform} onChangeText={setPlatform} placeholder={t('fleet.platformPlaceholder')} />
          <View style={styles.formRow}>
            <Field label={t('fleet.fare')} value={fare} onChangeText={setFare} placeholder="18.50" keyboardType="decimal-pad" />
            <Field label={t('fleet.distance')} value={distance} onChangeText={setDistance} placeholder="12.4" keyboardType="decimal-pad" />
          </View>
          <View style={styles.formRow}>
            <Field label={t('fleet.deadhead')} value={deadhead} onChangeText={setDeadhead} placeholder="0" keyboardType="decimal-pad" />
            <Field label={t('fleet.duration')} value={duration} onChangeText={setDuration} placeholder="25" keyboardType="number-pad" />
          </View>
          <Field label={t('fleet.tripCommission')} value={commission} onChangeText={setCommission} placeholder={vehicle?.commission_rate ? String(vehicle.commission_rate) : '20'} keyboardType="decimal-pad" />
          <Field label={t('fleet.energyOverride')} value={energyPrice} onChangeText={setEnergyPrice} placeholder={t('fleet.invoicePriceHint')} keyboardType="decimal-pad" />
          <Button label={saving ? t('fleet.calculating') : t('fleet.calculateButton')} icon="function" loading={saving} disabled={!selectedVehicle || !platform.trim() || Number(fare) < 0 || Number(distance) <= 0} onPress={() => void calculate()} />
        </>}
      </SectionCard>

      {tripDetail ? <SectionCard title={t('fleet.latestCalculation')} subtitle={`${tripDetail.platform_name} · ${formatDate(tripDetail.created_at)}`}>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.netProfit')}</AppText><AppText variant="title" tone={toNumber(tripDetail.net_profit) >= 0 ? 'profit' : 'loss'}>{formatCurrency(tripDetail.net_profit, tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.grossFare')}</AppText><AppText variant="label">{formatCurrency(tripDetail.gross_fare, tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.costBreakdown')}</AppText><AppText variant="label">{formatCurrency(toNumber(tripDetail.energy_cost) + toNumber(tripDetail.commission_cost) + toNumber(tripDetail.depreciation_cost), tripDetail.currency_code)}</AppText></View>
        <View style={styles.resultRow}><AppText variant="caption" tone="muted">{t('fleet.breakEven')}</AppText><AppText variant="label">{formatCurrency(tripDetail.break_even_fare, tripDetail.currency_code)} · {tripDetail.verdict}</AppText></View>
      </SectionCard> : null}

      <SectionCard title={t('fleet.recentRides')} subtitle={t('fleet.recentRidesSubtitle')} padded={false}>
        {loading ? <AppText variant="caption" tone="muted">{t('fleet.loadingTrips')}</AppText> : tripList.length === 0 ? <EmptyState message={t('fleet.noRides')} hint={t('fleet.noRidesHint')} /> : tripList.map((trip) => (
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
const styles = StyleSheet.create({ screen: { gap: Spacing.lg }, field: { flex: 1, gap: Spacing.xs }, formRow: { flexDirection: 'row', gap: Spacing.md }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }, choice: { overflow: 'hidden', borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, input: { height: 46, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, fontSize: 16 }, resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md } });
