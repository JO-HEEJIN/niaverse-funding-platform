import { useState, useEffect } from 'react';

interface ExchangeRateData {
  rate: number;
  timestamp: string;
  cached: boolean;
  loading: boolean;
  error: string | null;
}

export function useExchangeRate(): ExchangeRateData {
  const [data, setData] = useState<ExchangeRateData>({
    rate: 1387, // Default rate
    timestamp: new Date().toISOString(),
    cached: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const fetchExchangeRate = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch('/api/exchange-rate');
        const result = await response.json();
        
        if (!mounted) return;
        
        if (result.success) {
          setData({
            rate: result.rate,
            timestamp: result.timestamp,
            cached: result.cached,
            loading: false,
            error: null
          });
        } else {
          setData(prev => ({
            ...prev,
            loading: false,
            error: result.error || 'Failed to fetch exchange rate'
          }));
        }
      } catch (error) {
        if (!mounted) return;
        
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Network error'
        }));
      }
    };

    // Initial fetch
    fetchExchangeRate();

    // Set up periodic updates every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return data;
}

// Utility function to calculate VAST value in KRW
export function calculateVASTValueInKRW(vastAmount: number, usdToKrwRate: number): number {
  const vastToUSD = 1; // 1 VAST = $1
  return vastAmount * vastToUSD * usdToKrwRate;
}

// Format exchange rate for display
export function formatExchangeRate(rate: number): string {
  return `$1 = ₩${rate.toLocaleString('ko-KR')}`;
}