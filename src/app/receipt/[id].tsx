import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { StatusPill } from '@/components/ui/status-pill';
import { AppText } from '@/components/ui/text';
import { PremiumGate } from '@/components/ui/premium-gate';
import { useAsync } from '@/hooks/use-async';
import { usePremium } from '@/features/premium/use-premium';
import { useAuth } from '@/lib/auth-store';
import { fuelInvoices } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/format';
import { Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

/**
 * Receipt detail.
 *
 * The extracted figures (amount, litres, fuel type, date) are free — that is
 * the value of scanning at all. The raw OCR text, kept by the API for auditing
 * a bad read, is a premium view.
 */
export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const colors = useColors();
  const { isPremium } = usePremium();
  const [isDeleting, setIsDeleting] = useState(false);

  const receiptId = Number(id);
  const { data, error, isLoading, refresh, isRefreshing } = useAsync(
    () => fuelInvoices.show(token!, receiptId),
    [token, receiptId],
  );

  const invoice = data?.invoice;

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete receipt', 'The image and its extracted data will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) {
            return;
          }

          setIsDeleting(true);

          try {
            await fuelInvoices.remove(token, receiptId);
            router.back();
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [receiptId, token]);

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerRow}>
            <Button
              label="Close"
              variant="ghost"
              fullWidth={false}
              onPress={() => router.back()}
            />
            {invoice ? <StatusPill status={invoice.status} /> : null}
          </View>

          {isLoading ? (
            <AppText variant="caption" tone="muted">
              Loading receipt…
            </AppText>
          ) : error || !invoice ? (
            <GlassSurface style={styles.card}>
              <AppText variant="heading">Receipt unavailable</AppText>
              <AppText variant="caption" tone="loss">
                {error ?? 'This receipt no longer exists.'}
              </AppText>
            </GlassSurface>
          ) : (
            <>
              <GlassSurface style={styles.hero}>
                <AppText variant="caption" tone="muted">
                  TOTAL PAID
                </AppText>
                <AppText variant="display" numeric tone="neutral">
                  {formatCurrency(invoice.total_amount_paid)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {formatDate(invoice.invoice_date ?? invoice.created_at)}
                </AppText>
              </GlassSurface>

              <GlassSurface style={styles.card}>
                <DetailRow
                  icon="drop.fill"
                  label="Fuel volume"
                  value={
                    invoice.fuel_volume_units === null
                      ? '—'
                      : `${toNumber(invoice.fuel_volume_units)} L`
                  }
                />
                <DetailRow
                  icon="fuelpump.fill"
                  label="Fuel type"
                  value={invoice.fuel_type ?? '—'}
                />
                <DetailRow
                  icon="calendar"
                  label="Invoice date"
                  value={formatDate(invoice.invoice_date)}
                />
                <DetailRow
                  icon="clock"
                  label="Uploaded"
                  value={formatDateTime(invoice.created_at)}
                />
                {invoice.fuel_volume_units && invoice.total_amount_paid ? (
                  <DetailRow
                    icon="tag.fill"
                    label="Price per litre"
                    value={formatCurrency(
                      toNumber(invoice.total_amount_paid) / toNumber(invoice.fuel_volume_units),
                    )}
                  />
                ) : null}
              </GlassSurface>

              {invoice.status !== 'completed' ? (
                <GlassSurface style={styles.notice}>
                  <SymbolView name="info.circle" size={15} tintColor={colors.neutral} />
                  <AppText variant="caption" tone="muted" style={styles.noticeText}>
                    The OCR job is still running. Pull down to refresh and the extracted numbers
                    will appear here.
                  </AppText>
                </GlassSurface>
              ) : null}

              <PremiumGate
                feature="photos"
                isPremium={isPremium}
                unlocked={
                  <GlassSurface style={styles.card}>
                    <AppText variant="label">Raw OCR text</AppText>
                    <AppText variant="caption" tone="muted" style={styles.ocr}>
                      {invoice.ocr_raw_text ?? 'Nothing was extracted from this image.'}
                    </AppText>
                  </GlassSurface>
                }
              />

              <Button
                label={isDeleting ? 'Deleting…' : 'Delete receipt'}
                icon="trash"
                variant="danger"
                loading={isDeleting}
                onPress={confirmDelete}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof SymbolView>['name'];
  label: string;
  value: string;
}) {
  const colors = useColors();

  return (
    <View style={styles.detailRow}>
      <SymbolView name={icon} size={14} tintColor={colors.inkMuted} />
      <AppText variant="caption" tone="muted" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="label" numeric>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: { padding: Spacing.lg, gap: Spacing.xs, alignItems: 'center' },
  card: { padding: Spacing.lg, gap: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailLabel: { flex: 1 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  noticeText: { flex: 1 },
  ocr: { lineHeight: 18 },
});
