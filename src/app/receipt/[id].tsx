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
import { energyInvoices } from '@/lib/endpoints';
import { formatCurrency, formatDate, formatDateTime, toNumber } from '@/lib/format';
import { Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';
import { useLanguage } from '@/lib/i18n';

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
  const { t } = useLanguage();
  const { isPremium } = usePremium();
  const [isDeleting, setIsDeleting] = useState(false);

  const receiptId = Number(id);
  const { data, error, isLoading, refresh, isRefreshing } = useAsync(
    () => energyInvoices.show(token!, receiptId),
    [token, receiptId],
  );

  const invoice = data?.invoice;

  const confirmDelete = useCallback(() => {
    Alert.alert(t('receiptDetail.deleteTitle'), t('receiptDetail.deleteMessage'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('receiptDetail.delete'),
        style: 'destructive',
        onPress: async () => {
          if (!token) {
            return;
          }

          setIsDeleting(true);

          try {
            await energyInvoices.remove(token, receiptId);
            router.back();
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [receiptId, t, token]);

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
              label={t('receiptDetail.close')}
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
              <AppText variant="heading">{t('receiptDetail.unavailable')}</AppText>
              <AppText variant="caption" tone="loss">
                {error ?? t('receiptDetail.notFound')}
              </AppText>
            </GlassSurface>
          ) : (
            <>
              <GlassSurface style={styles.hero}>
                <AppText variant="caption" tone="muted">
                  {t('receiptDetail.totalPaid')}
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
                  label={t('receiptDetail.title')}
                  value={invoice.energy_amount === null
                    ? (invoice.fuel_volume_units === null ? '—' : `${toNumber(invoice.fuel_volume_units)} L`)
                    : `${toNumber(invoice.energy_amount)} ${invoice.energy_unit ?? ''}`}
                />
                <DetailRow
                  icon="fuelpump.fill"
                  label={t('receiptDetail.type')}
                  value={invoice.fuel_type ?? invoice.energy_type ?? '—'}
                />
                <DetailRow
                  icon="calendar"
                  label={t('receiptDetail.date')}
                  value={formatDate(invoice.invoice_date)}
                />
                <DetailRow
                  icon="clock"
                  label={t('receiptDetail.uploaded')}
                  value={formatDateTime(invoice.created_at)}
                />
                {(invoice.energy_amount ?? invoice.fuel_volume_units) && invoice.total_amount_paid ? (
                  <DetailRow
                    icon="tag.fill"
                    label={t('receiptDetail.unitPrice', { unit: invoice.energy_unit ?? 'unit' })}
                    value={formatCurrency(
                      toNumber(invoice.unit_price) || toNumber(invoice.total_amount_paid) / toNumber(invoice.energy_amount ?? invoice.fuel_volume_units),
                      invoice.currency_code ?? 'USD',
                    )}
                  />
                ) : null}
              </GlassSurface>

              {invoice.status === 'review_required' ? (
                <Button label="Review extracted details" icon="pencil" variant="secondary" onPress={() => router.push('/receipts')} />
              ) : null}

              {invoice.status !== 'completed' ? (
                <GlassSurface style={styles.notice}>
                  <SymbolView name="info.circle" size={15} tintColor={colors.neutral} />
                  <AppText variant="caption" tone="muted" style={styles.noticeText}>
                    {t('receiptDetail.notice')}
                  </AppText>
                </GlassSurface>
              ) : null}

              <PremiumGate
                feature="photos"
                isPremium={isPremium}
                unlocked={
                  <GlassSurface style={styles.card}>
                    <AppText variant="label">{t('receiptDetail.rawText')}</AppText>
                    <AppText variant="caption" tone="muted" style={styles.ocr}>
                      {invoice.ocr_raw_text ?? t('receiptDetail.emptyText')}
                    </AppText>
                  </GlassSurface>
                }
              />

              <Button
                label={isDeleting ? t('receiptDetail.deleting') : t('receiptDetail.delete')}
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
