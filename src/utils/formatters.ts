export function formatPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '$0.00';
  return `$${amount.toFixed(2)}`;
}

export function formatSavingsPercent(original: number, current: number): string {
  if (!Number.isFinite(original) || !Number.isFinite(current) || original <= 0) return 'Save 0%';
  const percent = Math.round(((original - current) / original) * 100);
  return `Save ${Math.max(0, percent)}%`;
}

export function formatSavingsAmount(original: number, current: number): string {
  if (!Number.isFinite(original) || !Number.isFinite(current)) return 'Save $0.00';
  const savings = Math.max(0, original - current);
  return `Save $${savings.toFixed(2)}`;
}
