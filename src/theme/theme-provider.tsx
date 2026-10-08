import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, type ThemeColors } from '@/theme/colors';

export type ThemeMode = 'light' | 'dark';
export type ThemeSnapshot = { mode: ThemeMode; colors: ThemeColors };

const ThemeContext = createContext<ThemeSnapshot | null>(null);

/**
 * Resolves the active colour scheme once and shares it with the whole tree, so
 * screens never call `useColorScheme()` directly and light/dark values are
 * always read from the same source.
 */
export function AppThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();

  const value = useMemo<ThemeSnapshot>(() => {
    const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';

    return { mode, colors: Colors[mode] };
  }, [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeSnapshot {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useAppTheme must be used inside <AppThemeProvider>.');
  }

  return context;
}

/** Convenience hook when only the colour tokens are needed. */
export function useColors(): ThemeColors {
  return useAppTheme().colors;
}
