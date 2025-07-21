// Number formatting utilities for the NIA Cloud platform

// Format Korean Won currency with thousand separators
export function formatKRW(amount: number | string): string {
  // Ensure we're working with a clean number
  let numericAmount: number;
  
  if (typeof amount === 'string') {
    // Remove any existing currency symbols and non-numeric characters except decimal point
    const cleanString = amount.replace(/[₩,\s]/g, '');
    numericAmount = parseFloat(cleanString) || 0;
  } else {
    numericAmount = amount || 0;
  }
  
  // Ensure we have a valid number and remove any decimals for currency display
  const finalAmount = Math.floor(numericAmount);
  
  return `₩${finalAmount.toLocaleString('ko-KR')}`;
}

// Format coin amounts (remove decimals, add thousand separators)
export function formatCoinAmount(amount: number | string, unit: string = 'Doge'): string {
  // Ensure we have a valid number
  let numericAmount: number;
  
  if (typeof amount === 'string') {
    numericAmount = parseFloat(amount) || 0;
  } else {
    numericAmount = amount || 0;
  }
  
  // Check for NaN and default to 0
  if (isNaN(numericAmount)) {
    numericAmount = 0;
  }
  
  return `${Math.floor(numericAmount).toLocaleString('ko-KR')} ${unit}`;
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