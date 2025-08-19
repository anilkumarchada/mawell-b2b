import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const colors = {
  primary: '#2563EB', // Blue
  primaryContainer: '#DBEAFE',
  secondary: '#059669', // Green
  secondaryContainer: '#D1FAE5',
  tertiary: '#DC2626', // Red
  tertiaryContainer: '#FEE2E2',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  background: '#FAFAFA',
  error: '#DC2626',
  errorContainer: '#FEE2E2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1E3A8A',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#064E3B',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#7F1D1D',
  onSurface: '#111827',
  onSurfaceVariant: '#6B7280',
  onBackground: '#111827',
  onError: '#FFFFFF',
  onErrorContainer: '#7F1D1D',
  outline: '#D1D5DB',
  outlineVariant: '#E5E7EB',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#374151',
  inverseOnSurface: '#F9FAFB',
  inversePrimary: '#93C5FD',
  elevation: {
    level0: 'transparent',
    level1: '#F9FAFB',
    level2: '#F3F4F6',
    level3: '#E5E7EB',
    level4: '#D1D5DB',
    level5: '#9CA3AF',
  },
  surfaceDisabled: '#F3F4F6',
  onSurfaceDisabled: '#9CA3AF',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

const fonts = {
  displayLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: 'Inter-Bold',
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: 'Inter-Medium',
    fontSize: 22,
    fontWeight: '400' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors,
  fonts,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...colors,
    surface: '#1F2937',
    surfaceVariant: '#374151',
    background: '#111827',
    onSurface: '#F9FAFB',
    onSurfaceVariant: '#D1D5DB',
    onBackground: '#F9FAFB',
  },
  fonts,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};