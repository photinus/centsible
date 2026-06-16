import { Platform } from 'react-native';

// ─── Colors ──────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  growthGreen: '#2DB87A',
  growthGreenLight: '#D5F5E3',
  actionOrange: '#F4845F',
  actionOrangeLight: '#FDE8DF',
  secureBlue: '#1B6CA8',

  // App backgrounds
  appBackground: '#EEF5FB',
  cardBackground: '#FFFFFF',

  // Account buckets
  spendBg: '#D5F5E3',
  spendAccent: '#27AE60',
  spendText: '#1A7A45',

  saveBg: '#FEF9E7',
  saveAccent: '#F39C12',
  saveText: '#9A6C00',

  giveBg: '#FDECEA',
  giveAccent: '#E74C3C',
  giveText: '#A93226',

  // Kid sidebar
  kidSidebarBg: '#D6EAF8',
  kidSidebarActive: '#FDEBD0',
  kidSidebarActiveText: '#E67E22',
  kidSidebarText: '#2C3E50',

  // Parent sidebar
  parentSidebarBg: '#1B6CA8',
  parentSidebarActive: '#2980B9',
  parentSidebarText: '#FFFFFF',
  parentSidebarMuted: 'rgba(255,255,255,0.6)',

  // Total stash card gradient
  stashGradientStart: '#A8D8B9',
  stashGradientEnd: '#6DC796',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#4A5568',
  textMuted: '#9CA3AF',
  textWhite: '#FFFFFF',

  // Status
  pending: '#F39C12',
  pendingBg: '#FEF9E7',
  approved: '#27AE60',
  approvedBg: '#D5F5E3',
  denied: '#E74C3C',
  deniedBg: '#FDECEA',

  // Common
  white: '#FFFFFF',
  black: '#000000',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.4)',

  // Chart line colors
  chartGreen: '#2DB87A',
  chartBlue: '#3498DB',
  chartOrange: '#E67E22',
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radius ───────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ─── Typography ──────────────────────────────────────────────────────────────

export const FontFamily = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40, color: Colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, color: Colors.textPrimary },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, color: Colors.textPrimary },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, color: Colors.textPrimary },

  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, color: Colors.textMuted },
  label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  amount: { fontSize: 40, fontWeight: '700' as const, lineHeight: 48, color: Colors.textPrimary },
  amountMd: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, color: Colors.textPrimary },
  amountSm: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24, color: Colors.textPrimary },
};

// ─── Shadow ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20 },
    android: { elevation: 8 },
    default: {},
  }),
};

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const Breakpoints = {
  /** Screens >= this width use the sidebar layout instead of bottom tabs */
  tablet: 600,
  /** Screens >= this use wider content containers */
  desktop: 1024,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export const Layout = {
  sidebarWidth: 200,
  bottomNavHeight: 64,
  headerHeight: 56,
  cardPadding: Spacing.md,
};
