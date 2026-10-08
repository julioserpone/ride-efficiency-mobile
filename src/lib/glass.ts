import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

/**
 * `true` when the running build can render the real iOS 26 Liquid Glass effect.
 *
 * Both native checks are wrapped in a try/catch: `isLiquidGlassAvailable()`
 * inspects the compiler and Info.plist settings of the compiled app and throws
 * on builds that do not expose the API at all.
 *
 * The result is computed once when the module is first evaluated (the platform
 * never changes at runtime), so no component has to call it inside an effect.
 */
export const LIQUID_GLASS_AVAILABLE: boolean = resolveLiquidGlassAvailability();

function resolveLiquidGlassAvailability(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}
