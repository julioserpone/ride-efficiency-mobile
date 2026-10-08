import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/theme/theme-provider';

/**
 * Ambient background behind every screen.
 *
 * Liquid Glass only reads as glass when there is something behind it to blur,
 * so the app paints a soft aurora of the brand teal (plus a hint of the
 * profit-neutral amber) over the canvas colour. The blobs are positioned at
 * the edges so no content ever sits on top of the brightest area.
 */
export function AuroraBackground({ children, style, ...rest }: ViewProps) {
  const { mode, colors } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }, style]} {...rest}>
      <LinearGradient
        colors={
          mode === 'dark'
            ? ['rgba(44,212,217,0.20)', 'rgba(7,15,18,0)']
            : ['rgba(13,165,174,0.18)', 'rgba(245,248,248,0)']
        }
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 0.65 }}
        style={styles.topBlob}
        pointerEvents="none"
      />
      <LinearGradient
        colors={
          mode === 'dark'
            ? ['rgba(91,141,239,0.16)', 'rgba(7,15,18,0)']
            : ['rgba(91,141,239,0.14)', 'rgba(245,248,248,0)']
        }
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.3 }}
        style={styles.bottomBlob}
        pointerEvents="none"
      />
      <LinearGradient
        colors={
          mode === 'dark'
            ? ['rgba(245,158,11,0.10)', 'rgba(7,15,18,0)']
            : ['rgba(245,158,11,0.10)', 'rgba(245,248,248,0)']
        }
        start={{ x: 0.9, y: 0.1 }}
        end={{ x: 0.4, y: 0.6 }}
        style={styles.warmBlob}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBlob: {
    position: 'absolute',
    top: -140,
    left: -90,
    right: -60,
    height: 420,
    borderBottomLeftRadius: 320,
    borderBottomRightRadius: 260,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -180,
    left: -80,
    right: -40,
    height: 400,
    borderTopLeftRadius: 280,
    borderTopRightRadius: 320,
  },
  warmBlob: {
    position: 'absolute',
    top: 220,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 200,
  },
  content: { flex: 1 },
});
