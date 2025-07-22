import { NextResponse } from 'next/server';

// Cache for exchange rate data
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchUSDToKRWRate(): Promise<number> {
  // Check cache first
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate;
  }

  try {
    // Try multiple exchange rate APIs for reliability
    const apis = [
      'https://api.exchangerate-api.com/v4/latest/USD',
      'https://api.fixer.io/latest?base=USD&symbols=KRW',
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Handle different API response formats
        let rate: number | undefined;
        if (data.rates?.KRW) {
          rate = data.rates.KRW;
        }
        
        if (rate && rate > 0) {
          // Cache the result
          cachedRate = {
            rate: rate,
            timestamp: Date.now()
          };
          return rate;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${apiUrl}:`, error);
        continue;
      }
    }
    
    // If all APIs fail, return a reasonable default based on recent rates
    console.warn('All exchange rate APIs failed, using default rate');
    return 1387; // Current approximate rate
    
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 1387; // Fallback rate
  }
}

export async function GET() {
  try {
    const rate = await fetchUSDToKRWRate();
    
    return NextResponse.json({
      success: true,
      rate: rate,
      timestamp: new Date().toISOString(),
      cached: cachedRate ? Date.now() - cachedRate.timestamp < CACHE_DURATION : false
    });
  } catch (error) {
    console.error('Exchange rate API error:', error);
    
    return NextResponse.json({
      success: false,
      rate: 1387, // Fallback rate
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch exchange rate'
    }, { status: 500 });
  }
}