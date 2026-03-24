// Apple Human Interface Guidelines color palettes

export type ThemeColors = {
  [K in keyof typeof DarkColors]: string;
};

export const DarkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  accent: '#30D158',
  accentDim: '#28A745',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  danger: '#FF453A',
  border: '#38383A',
  scanRing: '#30D158',
  warning: '#FF9F0A',
  accentOnDark: '#000000',
} as const;

export const LightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  surfaceLight: '#E5E5EA',
  accent: '#34C759',
  accentDim: '#28A745',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textMuted: '#AEAEB2',
  danger: '#FF3B30',
  border: '#C6C6C8',
  scanRing: '#34C759',
  warning: '#FF9500',
  accentOnDark: '#FFFFFF',
} as const;

// Default export for backward compatibility — will be overridden by ThemeContext at runtime
export const Colors = DarkColors;
