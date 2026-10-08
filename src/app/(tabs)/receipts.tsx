import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Button } from '@/components/ui/button';
import { EmptyState, SectionCard } from '@/components/ui/card';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { StatusPill } from '@/components/ui/status-pill';
import { AppText } from '@/components/ui/text';
import { useReceipts } from '@/hooks/use-receipts';
import { formatCurrency, formatDate, toNumber } from '@/lib/format';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

/**
 * Receipts — capture and browse fuel invoices.
 *
 * Both entry points (camera and gallery) go through `expo-image-picker`, which
 * is what the backend expects: a multipart upload of a JPG/PNG/PDF under 10 MB
 * to `POST /api/v1/fuel-invoices`, after which the API queues the OCR job.
 */
export default function ReceiptsScreen() {
  const colors = useColors();
  const receipts = useReceipts();
  const [lastUploadedId, setLastUploadedId] = useState<number | null>(null);

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

  return (
    <Screen title="Receipts" subtitle="Photograph a fuel invoice and let the app read it">
      <GlassSurface style={styles.capture}>
        <View style={[styles.captureIcon, { backgroundColor: colors.primary }]}>
          <SymbolView name="camera.viewfinder" size={30} tintColor="#FFFFFF" />
        </View>
        <AppText variant="heading">Scan a fuel invoice</AppText>
        <AppText variant="caption" tone="muted" style={styles.captureHint}>
          Line the receipt up inside the frame. We extract the amount, litres, fuel type and date
          automatically.
        </AppText>

        <View style={styles.captureActions}>
          <Button
            label={receipts.isUploading ? 'Uploading…' : 'Take photo'}
            icon="camera.fill"
            loading={receipts.isUploading}
            onPress={() => void takePhoto()}
          />
          <Button
            label="Choose file"
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

        {lastUploadedId !== null && !receipts.isUploading && !receipts.uploadError ? (
          <View style={[styles.success, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
            <SymbolView name="checkmark.circle.fill" size={15} tintColor={colors.profit} />
            <AppText variant="caption" tone="profit" style={styles.successText}>
              Uploaded. The OCR job is running — refresh in a moment to see the numbers.
            </AppText>
            <AppText
              variant="caption"
              tone="primary"
              onPress={() => router.push(`/receipt/${lastUploadedId}`)}
            >
              Open
            </AppText>
          </View>
        ) : null}
      </GlassSurface>

      <View style={styles.summaryRow}>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            RECEIPTS
          </AppText>
          <AppText variant="title" numeric>
            {receipts.invoices.length}
          </AppText>
        </SectionCard>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            TOTAL SPEND
          </AppText>
          <AppText variant="title" numeric>
            {formatCurrency(totalSpend, 'USD', null, { compact: true })}
          </AppText>
        </SectionCard>
        <SectionCard style={styles.summaryCard}>
          <AppText variant="caption" tone="muted">
            LITRES
          </AppText>
          <AppText variant="title" numeric>
            {totalLitres.toFixed(0)}
          </AppText>
        </SectionCard>
      </View>

      <SectionCard title="History" subtitle="Newest first" padded={false}>
        {receipts.isLoading ? (
          <AppText variant="caption" tone="muted">
            Loading receipts…
          </AppText>
        ) : receipts.invoices.length === 0 ? (
          <EmptyState
            message="No receipts yet"
            hint="Use the camera above to add your first fuel invoice."
          />
        ) : (
          receipts.invoices.map((invoice) => (
            <ListRow
              key={invoice.id}
              icon="doc.text"
              title={invoice.fuel_type ?? 'Fuel receipt'}
              subtitle={`${formatDate(invoice.invoice_date ?? invoice.created_at)}${
                invoice.fuel_volume_units ? ` · ${toNumber(invoice.fuel_volume_units)} L` : ''
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

      {receipts.error ? (
        <AppText variant="caption" tone="loss">
          {receipts.error}
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  capture: { padding: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
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
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryCard: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
});
