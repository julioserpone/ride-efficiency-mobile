/**
 * Ride Efficiency — "Aurora Teal" design tokens.
 *
 * The brand colour is a desaturated teal-cyan, deliberately distinct from the
 * colours already owned by the ride-hailing apps our users drive for:
 *
 * | Platform | Brand colour | Source                                        |
 * | -------- | ------------ | --------------------------------------------- |
 * | Uber     | #000000      | https://www.brandcolorcode.com/uber           |
 * | Lyft     | #FF00BF      | https://www.brandcolorcode.com/lyft           |
 * | Cabify   | #7145D6      | https://www.brandcolorcode.com/cabify         |
 * | DiDi     | #FD7C41      | https://www.brandcolorcode.com/didi           |
 * | inDrive  | #C0F01D      | sampled from the official logo vector         |
 *
 * Teal is calm, low-glare at night (drivers mostly read the app after dark) and
 * reads clearly on both the light and the dark scheme.
 *
 * The semantic colours (profit / neutral / loss) are intentionally identical to
 * the ones used by the `ride-efficiency-frontend` dashboard
 * (`src/assets/main.css`) so a driver moving between the web dashboard and the
 * app sees the same meaning for the same colour.
 */

/** Raw, scheme-independent palette. */
export const Palette = {
  /** Brand teal — the primary action colour. */
  primary: {
    light: '#0DA5AE',
    dark: '#2CD4D9',
  },
  /** Deep teal used for the brand mark and heavy surfaces. */
  deep: {
    light: '#06363E',
    dark: '#03323A',
  },
  /** Soft teal used for selected rows, chips and bars. */
  soft: {
    light: '#E6F6F7',
    dark: '#0E2A2F',
  },
  /** Semantic data colours, shared with the web dashboard. */
  profit: '#10B981',
  neutral: '#F59E0B',
  loss: '#EF4444',
  accent: '#5B8DEF',
  /** Fixed light-on-dark ink used on top of photographic backgrounds. */
  onImage: '#FFFFFF',
} as const;

/** Theme-aware colour tokens consumed by `useTheme()`. */
export type ThemeColors = {
  primary: string;
  primarySoft: string;
  deep: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  profit: string;
  neutral: string;
  loss: string;
  accent: string;
  onImage: string;
  /** Tint applied to the native iOS 26 glass effect. */
  glassTint: string;
  /** Fallback glass fill used on Android and on iOS < 26. */
  glassFallback: string;
  glassBorder: string;
  /** Shadow colour for elevation on light surfaces. */
  shadow: string;
};

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    primary: Palette.primary.light,
    primarySoft: Palette.soft.light,
    deep: Palette.deep.light,
    canvas: '#F5F8F8',
    surface: '#FFFFFF',
    surfaceMuted: '#EDF3F3',
    border: '#DCE6E6',
    ink: '#0B1B1E',
    inkMuted: '#5A6E72',
    inkFaint: '#93A6A9',
    profit: Palette.profit,
    neutral: Palette.neutral,
    loss: Palette.loss,
    accent: Palette.accent,
    onImage: Palette.onImage,
    glassTint: 'rgba(255, 255, 255, 0.55)',
    glassFallback: 'rgba(255, 255, 255, 0.78)',
    glassBorder: 'rgba(11, 27, 30, 0.08)',
    shadow: '#062A2F',
  },
  dark: {
    primary: Palette.primary.dark,
    primarySoft: Palette.soft.dark,
    deep: Palette.deep.dark,
    canvas: '#070F12',
    surface: '#101C20',
    surfaceMuted: '#16262B',
    border: '#1E3237',
    ink: '#E8F2F3',
    inkMuted: '#93AAB0',
    inkFaint: '#5F767C',
    profit: Palette.profit,
    neutral: Palette.neutral,
    loss: Palette.loss,
    accent: Palette.accent,
    onImage: Palette.onImage,
    glassTint: 'rgba(16, 28, 32, 0.55)',
    glassFallback: 'rgba(16, 28, 32, 0.78)',
    glassBorder: 'rgba(232, 242, 243, 0.12)',
    shadow: '#000000',
  },
};

export type ThemeColor = keyof ThemeColors;
