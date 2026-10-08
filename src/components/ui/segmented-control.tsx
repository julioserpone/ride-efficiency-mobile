import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Radius } from '@/theme/tokens';
import { useColors } from '@/theme/theme-provider';

export type SegmentedControlProps = {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
};

/** Two-or-more option switch used to flip a period (weekly / monthly). */
export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const colors = useColors();

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.surface },
            ]}
          >
            <AppText
              variant="label"
              style={{ color: isSelected ? colors.primary : colors.inkMuted }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
