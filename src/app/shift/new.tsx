import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { AppText } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { shifts } from '@/lib/endpoints';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Default platform list — matches the providers the API tracks per shift. */
const PROVIDERS = ['Uber', 'DiDi', 'Lyft', 'inDrive', 'Cabify'] as const;

type ProviderEarnings = Record<string, string>;

/**
 * Log a shift.
 *
 * Sends the daily GPS kilometres, connected minutes and per-platform earnings,
 * then closes the shift so the API computes fuel cost, depreciation and the
 * real net profit (`POST /shifts` followed by `POST /shifts/{id}/close`).
 */
export default function NewShiftScreen() {
  const { token } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [km, setKm] = useState('');
  const [minutes, setMinutes] = useState('');
  const [trips, setTrips] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [earnings, setEarnings] = useState<ProviderEarnings>({});
  const [isSaving, setIsSaving] = useState(false);

  const grossTotal = Object.values(earnings).reduce(
    (sum, value) => sum + (Number.parseFloat(value) || 0),
    0,
  );
  const fuel = Number.parseFloat(fuelCost) || 0;

  const canSave = km.trim().length > 0 && !isSaving;

  const save = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      const providerEarnings = Object.entries(earnings)
        .filter(([, value]) => Number.parseFloat(value) > 0)
        .map(([provider_name, value]) => ({
          provider_name,
          gross_amount: Number.parseFloat(value),
        }));

      const created = await shifts.start(token, {
        shift_date: shiftDate,
        total_km_gps: Number.parseFloat(km) || 0,
        total_minutes_connected: Number.parseInt(minutes, 10) || 0,
        total_trips_completed: Number.parseInt(trips, 10) || 0,
        earnings: providerEarnings,
      });

      await shifts.close(token, created.shift.id, {
        total_km_gps: Number.parseFloat(km) || 0,
        total_minutes_connected: Number.parseInt(minutes, 10) || 0,
        total_trips_completed: Number.parseInt(trips, 10) || 0,
        applied_fuel_cost: fuel > 0 ? fuel : undefined,
      });

      router.back();
      Alert.alert(t('shift.saved'), t('shift.savedMessage'));
    } catch (saveError) {
      const message =
        saveError instanceof ApiError
          ? saveError.message
          : t('shift.errorMessage');

      Alert.alert(t('shift.errorTitle'), message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuroraBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex} edges={['bottom']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <AppText variant="title">{t('shift.title')}</AppText>
                <AppText variant="caption" tone="muted">
                  {t('shift.subtitle')}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <GlassSurface style={styles.closeButtonGlass}>
                  <SymbolView name="xmark" size={20} tintColor={colors.ink} />
                </GlassSurface>
              </TouchableOpacity>
            </View>

            <GlassSurface style={styles.card}>
              <Field label={t('shift.date')} value={shiftDate} onChangeText={setShiftDate} placeholder="2026-08-01" />
              <Field
                label={t('shift.kilometres')}
                value={km}
                onChangeText={setKm}
                placeholder="184.5"
                keyboardType="decimal-pad"
              />
              <Field
                label={t('shift.minutes')}
                value={minutes}
                onChangeText={setMinutes}
                placeholder="420"
                keyboardType="number-pad"
              />
              <Field
                label={t('shift.trips')}
                value={trips}
                onChangeText={setTrips}
                placeholder="23"
                keyboardType="number-pad"
              />
              <Field
                label={t('shift.fuel')}
                value={fuelCost}
                onChangeText={setFuelCost}
                placeholder="38.50"
                keyboardType="decimal-pad"
              />
            </GlassSurface>

            <GlassSurface style={styles.card}>
              <AppText variant="label">{t('shift.earnings')}</AppText>
              {PROVIDERS.map((provider) => (
                <View key={provider} style={styles.earningRow}>
                  <AppText variant="caption" tone="muted" style={styles.earningLabel}>
                    {provider}
                  </AppText>
                  <TextInput
                    value={earnings[provider] ?? ''}
                    onChangeText={(value) =>
                      setEarnings((current) => ({ ...current, [provider]: value }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.inkFaint}
                    style={[
                      styles.earningInput,
                      { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                  />
                </View>
              ))}

              <View style={styles.totalRow}>
                <AppText variant="caption" tone="muted">
                  {t('shift.grossTotal')}
                </AppText>
                <AppText variant="heading" numeric tone="profit">
                  ${grossTotal.toFixed(2)}
                </AppText>
              </View>
              <AppText variant="caption" tone="faint">
                {t('shift.fuelDepreciation')}{fuel > 0 ? t('shift.fuelEntered', { amount: `$${fuel.toFixed(2)}` }) : ''}.
              </AppText>
            </GlassSurface>

            <Button
              label={isSaving ? t('shift.saving') : t('shift.save')}
              icon="checkmark"
              loading={isSaving}
              disabled={!canSave}
              onPress={() => void save()}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AuroraBackground>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.input,
          { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headerText: { flex: 1, gap: Spacing.xs },
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
  card: { padding: Spacing.lg, gap: Spacing.md },
  field: { gap: Spacing.xs },
  input: {
    height: 46,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  earningRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  earningLabel: { flex: 1 },
  earningInput: {
    width: 110,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    textAlign: 'right',
    fontSize: 15,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});
