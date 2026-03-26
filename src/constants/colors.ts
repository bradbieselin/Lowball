// Native iOS System Colors (Human Interface Guidelines)

export type ThemeColors = {
  [K in keyof typeof DarkColors]: string;
};

export const DarkColors = {
  // System backgrounds (iOS dark)
  background: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  // Primary action color
  accent: '#FFFFFF',
  accentDim: '#E5E5EA',
  // System label colors
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#48484A',
  // System red
  danger: '#FF453A',
  // System separator
  border: '#38383A',
  // Feature-specific
  scanRing: '#FFFFFF',
  // System orange
  warning: '#FF9F0A',
  // For text/icons on accent backgrounds
  accentOnDark: '#000000',
  // System green — used for savings/money
  savings: '#30D158',
} as const;

export const LightColors: ThemeColors = {
  // System backgrounds (iOS light)
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceLight: '#E5E5EA',
  // Primary action color
  accent: '#000000',
  accentDim: '#1C1C1E',
  // System label colors
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  // System red
  danger: '#FF3B30',
  // System separator
  border: '#C6C6C8',
  // Feature-specific
  scanRing: '#000000',
  // System orange
  warning: '#FF9500',
  // For text/icons on accent backgrounds
  accentOnDark: '#FFFFFF',
  // System green — used for savings/money
  savings: '#34C759',
} as const;

// Default export for backward compatibility — will be overridden by ThemeContext at runtime
export const Colors = DarkColors;
