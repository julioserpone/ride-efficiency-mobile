import { AuroraBackground } from '@/components/ui/aurora-background';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/theme/tokens';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ScreenProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Trailing content rendered next to the title (e.g. the premium badge). */
  headerAccessory?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Screen scaffold: aurora gradient background, large title and one shared
 * scroll behaviour. Every tab renders through this so headers never drift.
 */
export function Screen({
  title,
  subtitle,
  children,
  headerAccessory,
  scroll = true,
  contentStyle,
}: ScreenProps) {
  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <AppText variant="display" style={styles.title}>
          {title}
        </AppText>
        {headerAccessory}
      </View>
      {subtitle ? (
        <AppText variant="caption" tone="muted">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );

  if (!scroll) {
    return (
      <AuroraBackground>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={[styles.content, contentStyle]}>
            {header}
            {children}
          </View>
        </SafeAreaView>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          {children}
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.tabBarInset,
    gap: Spacing.lg,
  },
  header: { gap: Spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: { flexShrink: 1 },
});
