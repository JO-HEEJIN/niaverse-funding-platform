/**
 * 펀딩별 수익률 설정
 * 
 * 이 파일은 각 펀딩 타입별로 수익률을 정의합니다.
 * 수익률은 관리자가 쉽게 변경할 수 있도록 중앙화되어 있습니다.
 */

export interface IncomeRate {
  fundingId: string;
  fundingName: string;
  type: 'daily_fixed' | 'monthly_percentage' | 'disabled';
  rate: number;
  description: string;
}

export const INCOME_RATES: IncomeRate[] = [
  {
    fundingId: 'funding-1',
    fundingName: 'Doge Coin Mining',
    type: 'daily_fixed',
    rate: 2, // 1 mining unit = 2 Doge/day (1 mining unit당 하루에 2 Doge)
    description: 'Each mining unit generates 2 Doge per day'
  },
  {
    fundingId: 'funding-2', 
    fundingName: 'Data Center',
    type: 'monthly_percentage',
    rate: 0.05, // 월 5% 수익률
    description: '5% monthly return on investment'
  },
  {
    fundingId: 'funding-3',
    fundingName: 'VAST Coin',
    type: 'disabled',
    rate: 0,
    description: 'VAST income calculation is disabled'
  }
];

/**
 * 특정 펀딩의 수익률 정보를 가져옵니다
 */
export function getIncomeRate(fundingId: string): IncomeRate | null {
  return INCOME_RATES.find(rate => rate.fundingId === fundingId) || null;
}

/**
 * 일일 수익을 계산합니다
 * @param fundingId - 펀딩 ID (funding-1, funding-2, funding-3)
 * @param quantity - 구매 수량 (mining units 또는 구매 금액)
 * @param currentIncome - 현재 누적 수익
 * @returns 새로운 누적 수익
 */
export function calculateDailyIncome(
  fundingId: string, 
  quantity: number, 
  currentIncome: number
): number {
  const rateConfig = getIncomeRate(fundingId);
  
  if (!rateConfig || rateConfig.type === 'disabled') {
    console.log(`[Income] ${fundingId}: Income calculation disabled`);
    return currentIncome; // 변화 없음
  }

  let dailyIncome = 0;

  switch (rateConfig.type) {
    case 'daily_fixed':
      // Doge: 1 mining unit = 1 Doge/day
      dailyIncome = quantity * rateConfig.rate;
      console.log(`[Income] ${fundingId}: ${quantity} units × ${rateConfig.rate} = ${dailyIncome} daily`);
      break;

    case 'monthly_percentage':
      // Data Center: 월 5% → 일 5%/30 = 0.167%
      const monthlyRate = rateConfig.rate;
      const dailyRate = monthlyRate / 30; // 월 수익률을 일 단위로 나눔
      const purchaseAmount = quantity; // Data Center는 quantity가 구매 금액
      dailyIncome = purchaseAmount * dailyRate;
      console.log(`[Income] ${fundingId}: ₩${purchaseAmount.toLocaleString()} × ${(dailyRate * 100).toFixed(3)}% = ₩${dailyIncome.toLocaleString()} daily`);
      break;

    default:
      console.warn(`[Income] ${fundingId}: Unknown income type ${rateConfig.type}`);
      return currentIncome;
  }

  const newAccumulatedIncome = currentIncome + dailyIncome;
  console.log(`[Income] ${fundingId}: ${currentIncome} + ${dailyIncome} = ${newAccumulatedIncome}`);
  
  return newAccumulatedIncome;
}