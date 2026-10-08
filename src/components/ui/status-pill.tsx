import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import type { FuelInvoiceStatus } from '@/lib/types';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

const LABELS: Record<FuelInvoiceStatus, string> = {
  pending: 'Queued',
  processing: 'Reading',
  completed: 'Scanned',
  failed: 'Review',
};

/**
 * OCR state of a receipt. The driver needs to know at a glance whether the
 * numbers on screen were already extracted from the photo.
 */
export function StatusPill({ status }: { status: FuelInvoiceStatus }) {
  const colors = useColors();

  const tone: Record<FuelInvoiceStatus, { background: string; text: string }> = {
    pending: { background: colors.surfaceMuted, text: colors.inkMuted },
    processing: { background: colors.primarySoft, text: colors.primary },
    completed: { background: 'rgba(16,185,129,0.16)', text: colors.profit },
    failed: { background: 'rgba(239,68,68,0.16)', text: colors.loss },
  };

  return (
    <View style={[styles.pill, { backgroundColor: tone[status].background }]}>
      <AppText variant="caption" style={{ color: tone[status].text }}>
        {LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
});
