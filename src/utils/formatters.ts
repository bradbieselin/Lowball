export function formatPrice(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(num) || num < 0) return '$0.00';
  return `$${num.toFixed(2)}`;
}

export function formatSavingsPercent(original: string | number, current: string | number): string {
  const origNum = typeof original === 'string' ? parseFloat(original) : original;
  const currNum = typeof current === 'string' ? parseFloat(current) : current;
  if (!Number.isFinite(origNum) || !Number.isFinite(currNum) || origNum <= 0) return 'Save 0%';
  const percent = Math.round(((origNum - currNum) / origNum) * 100);
  return `Save ${Math.max(0, percent)}%`;
}

export function formatSavingsAmount(original: string | number, current: string | number): string {
  const origNum = typeof original === 'string' ? parseFloat(original) : original;
  const currNum = typeof current === 'string' ? parseFloat(current) : current;
  if (!Number.isFinite(origNum) || !Number.isFinite(currNum)) return 'Save $0.00';
  const savings = Math.max(0, origNum - currNum);
  return `Save $${savings.toFixed(2)}`;
}
