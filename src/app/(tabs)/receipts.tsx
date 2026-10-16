import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
import { AppText } from '@/components/ui/text';
import { useReceipts } from '@/hooks/use-receipts';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { countries as countriesApi, energyInvoices } from '@/lib/endpoints';
import { formatCurrency, formatDate, toNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import type { EnergyType, EnergyUnit } from '@/lib/types';
import { useColors } from '@/theme/theme-provider';
import { Radius, Spacing } from '@/theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

/**
 * Receipts — capture and browse fuel invoices.
 *
 * Both entry points (camera and gallery) go through `expo-image-picker`, which
 * is what the backend expects: a multipart upload of a JPG/PNG/PDF under 10 MB
 * to `POST /api/v1/fuel-invoices`, after which the API queues the OCR job.
 */
export default function ReceiptsScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const receipts = useReceipts();
  const { token } = useAuth();
  const [lastUploadedId, setLastUploadedId] = useState<number | null>(null);
  const [reviewInvoiceId, setReviewInvoiceId] = useState<number | null>(null);
  const [countries, setCountries] = useState<{ id: number; code: string; name: string }[]>([]);
  const [reviewCountry, setReviewCountry] = useState<number | null>(null);
  const [energyType, setEnergyType] = useState<EnergyType>('regular_gasoline');
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>('litres');
  const [energyAmount, setEnergyAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalPaid, setTotalPaid] = useState('');
  const [fuelName, setFuelName] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const totalSpend = receipts.invoices.reduce(
    (sum, invoice) => sum + toNumber(invoice.total_amount_paid),
    0,
  );
  const totalLitres = receipts.invoices.reduce(
    (sum, invoice) => sum + toNumber(invoice.fuel_volume_units),
    0,
  );

  const uploadFromPicker = useCallback(
    async (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const extension = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const type = asset.mimeType ?? (extension === 'png' ? 'image/png' : 'image/jpeg');

      const invoice = await receipts.upload({
        uri: asset.uri,
        name: asset.fileName ?? `receipt-${Date.now()}.${extension}`,
        type,
      });

      if (invoice) {
        setLastUploadedId(invoice.id);
      }
    },
    [receipts],
  );

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    await uploadFromPicker(result);
  }, [uploadFromPicker]);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    await uploadFromPicker(result);
  }, [uploadFromPicker]);

  useEffect(() => {
    if (!token) return;
    void countriesApi.list(token).then((result) => {
      setCountries(result.countries);
      setReviewCountry(result.countries[0]?.id ?? null);
    }).catch(() => undefined);
  }, [token]);

  const saveReview = async () => {
    if (!token || reviewInvoiceId === null || !reviewCountry || Number(energyAmount) <= 0 || Number(unitPrice) <= 0) return;
    setReviewing(true);
    try {
      await energyInvoices.review(token, reviewInvoiceId, {
        country_id: reviewCountry,
        energy_type: energyType,
        energy_unit: energyUnit,
        energy_amount: Number(energyAmount),
        unit_price: Number(unitPrice),
        ...(totalPaid ? { total_amount_paid: Number(totalPaid) } : {}),
        ...(fuelName ? { fuel_type: fuelName } : {}),
      });
      setReviewInvoiceId(null);
      setEnergyAmount(''); setUnitPrice(''); setTotalPaid(''); setFuelName('');
      await receipts.refresh();
    } catch (cause) {
      Alert.alert(t('receipt.reviewError'), cause instanceof ApiError ? cause.message : t('receipt.reviewTryAgain'));
    } finally { setReviewing(false); }
  };

  return (
    <Screen title={t('receipt.title')} subtitle={t('receipt.subtitle')} headerAccessory={<UserAvatar />}>
      <GlassSurface style={styles.capture}>
        <View style={[styles.captureIcon, { backgroundColor: colors.primary }]}>
          <SymbolView name="camera.viewfinder" size={30} tintColor="#FFFFFF" />
        </View>
        <AppText variant="heading">{t('receipt.scanTitle')}</AppText>
        <AppText variant="caption" tone="muted" style={styles.captureHint}>
          {t('receipt.scanDescription')}
        </AppText>

        <View style={styles.captureActions}>
          <Button
            label={receipts.isUploading ? t('receipt.uploading') : t('receipt.takePhoto')}
            icon="camera.fill"
            loading={receipts.isUploading}
            onPress={() => void takePhoto()}
          />
          <Button
            label={t('receipt.chooseFile')}
            icon="photo.on.rectangle"
            variant="secondary"
            disabled={receipts.isUploading}
            onPress={() => void pickFromLibrary()}
          />
        </View>

        {receipts.uploadError ? (
          <AppText variant="caption" tone="loss">
            {receipts.uploadError}
          </AppText>
        ) : null}
        {receipts.invoices.find((invoice) => invoice.id === lastUploadedId)?.status === 'review_required' ? (
          <AppText variant="caption" tone="neutral">{t('receipt.reviewPrompt')}</AppText>
        ) : null}

        {lastUploadedId !== null && !receipts.isUploading && !receipts.uploadError ? (
          <View style={[styles.success, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
            <SymbolView name="checkmark.circle.fill" size={15} tintColor={colors.profit} />
            <AppText variant="caption" tone="profit" style={styles.successText}>
              {t('receipt.ocrRunning')}
            </AppText>
            <AppText
              variant="caption"
              tone="primary"
              onPress={() => router.push(`/receipt/${lastUploadedId}`)}
            >
              {t('receipt.open')}
            </AppText>
          </View>
        ) : null}
      </GlassSurface>

      <View style={styles.summaryRow}>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            {t('receipt.count')}
          </AppText>
          <AppText variant="title" numeric>
            {receipts.invoices.length}
          </AppText>
        </SectionCard>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            {t('receipt.totalSpend')}
          </AppText>
          <AppText variant="title" numeric>
            {formatCurrency(totalSpend, 'USD', null, { compact: true })}
          </AppText>
        </SectionCard>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            {t('receipt.energyUnits')}
          </AppText>
          <AppText variant="title" numeric>
            {totalLitres.toFixed(0)}
          </AppText>
        </SectionCard>
      </View>

      <SectionCard title={t('receipt.history')} subtitle={t('receipt.newestFirst')} padded={false}>
        {receipts.isLoading ? (
          <AppText variant="caption" tone="muted">
            {t('receipt.loading')}
          </AppText>
        ) : receipts.invoices.length === 0 ? (
          <EmptyState
            message={t('receipt.noReceipts')}
            hint={t('receipt.noReceiptsHint')}
          />
        ) : (
          receipts.invoices.map((invoice) => (
            <ListRow
              key={invoice.id}
              icon="doc.text"
              title={invoice.fuel_type ?? t('receipt.energyReceipt')}
              subtitle={`${formatDate(invoice.invoice_date ?? invoice.created_at)}${
                invoice.energy_amount ? ` · ${toNumber(invoice.energy_amount)} ${invoice.energy_unit ?? ''}` : ''
              }`}
              value={
                invoice.total_amount_paid === null
                  ? '—'
                  : formatCurrency(invoice.total_amount_paid)
              }
              accessory={<StatusPill status={invoice.status} />}
              onPress={() => router.push(`/receipt/${invoice.id}`)}
            />
          ))
        )}
      </SectionCard>

      {reviewInvoiceId !== null ? (
        <SectionCard title={t('receipt.reviewTitle')} subtitle={t('receipt.reviewSubtitle')}>
          <AppText variant="caption" tone="muted">{t('receipt.country')}</AppText>
          <View style={styles.summaryRow}>{countries.map((country) => <AppText key={country.id} onPress={() => setReviewCountry(country.id)} variant="caption" tone={reviewCountry === country.id ? 'primary' : 'muted'}>{country.name}</AppText>)}</View>
          <AppText variant="caption" tone="muted">{t('receipt.energyType')}</AppText>
          <View style={styles.summaryRow}>{(['regular_gasoline', 'premium_gasoline', 'diesel', 'electric'] as EnergyType[]).map((type) => <AppText key={type} onPress={() => { setEnergyType(type); setEnergyUnit(type === 'electric' ? 'kwh' : 'litres'); }} variant="caption" tone={energyType === type ? 'primary' : 'muted'}>{type.replace('_', ' ')}</AppText>)}</View>
          {energyType === 'electric' ? null : <View style={styles.summaryRow}>{(['litres', 'gallons'] as EnergyUnit[]).map((unit) => <AppText key={unit} onPress={() => setEnergyUnit(unit)} variant="caption" tone={energyUnit === unit ? 'primary' : 'muted'}>{unit}</AppText>)}</View>}
          <ReviewField label={`${t('receipt.energyAmount')} (${energyUnit})`} value={energyAmount} onChangeText={setEnergyAmount} placeholder="12.5" />
          <ReviewField label={t('receipt.unitPrice')} value={unitPrice} onChangeText={setUnitPrice} placeholder="1.45" />
          <ReviewField label={t('receipt.totalPaid')} value={totalPaid} onChangeText={setTotalPaid} placeholder="18.13" />
          <ReviewField label={t('receipt.productName')} value={fuelName} onChangeText={setFuelName} placeholder="Regular" />
          <Button label={reviewing ? t('receipt.saving') : t('receipt.confirm')} icon="checkmark" loading={reviewing} disabled={!reviewCountry || Number(energyAmount) <= 0 || Number(unitPrice) <= 0} onPress={() => void saveReview()} />
          <Button label={t('receipt.cancel')} variant="ghost" onPress={() => setReviewInvoiceId(null)} />
        </SectionCard>
      ) : null}

      {receipts.error ? (
        <AppText variant="caption" tone="loss">
          {receipts.error}
        </AppText>
      ) : null}
    </Screen>
  );
}

function ReviewField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  const colors = useColors();
  return <View style={styles.reviewField}><AppText variant="caption" tone="muted">{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inkFaint} keyboardType="decimal-pad" style={[styles.reviewInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface }]} /></View>;
}

const styles = StyleSheet.create({
  capture: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  reviewField: { gap: Spacing.xs },
  reviewInput: { height: 46, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, fontSize: 16 },
  captureIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  captureHint: { textAlign: 'center', lineHeight: 18 },
  captureActions: { alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.sm },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignSelf: 'stretch',
  },
  successText: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  summaryCard: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
});
