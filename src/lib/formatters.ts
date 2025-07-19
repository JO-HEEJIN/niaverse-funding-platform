// Number formatting utilities for the NIA Cloud platform

// Format Korean Won currency with thousand separators
export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

// Format coin amounts (remove decimals, add thousand separators)
export function formatCoinAmount(amount: number, unit: string = 'Doge'): string {
  return `${Math.floor(amount).toLocaleString('ko-KR')} ${unit}`;
}

// Format regular numbers with thousand separators
export function formatNumber(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

// Format price display (removes unnecessary decimals)
export function formatPrice(price: number): string {
  if (price % 1 === 0) {
    // If it's a whole number, don't show decimals
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

// Validate and parse custom price input
export function parseCustomPrice(input: string): number {
  const cleanInput = input.replace(/[^0-9]/g, '');
  return parseInt(cleanInput) || 0;
}