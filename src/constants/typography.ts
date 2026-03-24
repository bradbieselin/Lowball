// Use system font (SF Pro on iOS, Roboto on Android) for Apple-native feel
export const FontFamily = {
  bold: 'System',
  semiBold: 'System',
  regular: 'System',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};
