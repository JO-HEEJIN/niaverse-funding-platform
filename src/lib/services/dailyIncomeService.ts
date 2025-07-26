/**
 * 일일 수익 계산 및 업데이트 서비스
 * 
 * 이 서비스는 매일 자정에 실행되어 모든 활성 구매 건에 대해
 * 수익을 계산하고 데이터베이스를 업데이트합니다.
 */

import { Pool } from 'pg';
import { calculateDailyIncome, getIncomeRate } from '../incomeRates';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://niaverse_admin:Qlalfqjsgh1@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse',
  ssl: {
    rejectUnauthorized: false
  }
});

export interface PurchaseRecord {
  id: string;
  userId: string;
  fundingId: string;
  quantity: number;
  price: number;
  accumulatedIncome: number;
  lastIncomeUpdate: Date;
  contractSigned: boolean;
  approved: boolean;
}

export class DailyIncomeService {
  /**
   * 모든 활성 구매 건을 가져옵니다
   * 조건: contract_signed = true AND approved = true
   */
  static async getActivePurchases(): Promise<PurchaseRecord[]> {
    const client = await pool.connect();
    try {
      console.log('[DailyIncome] Fetching active purchases...');
      
      const result = await client.query(`
        SELECT 
          id,
          user_id as "userId",
          funding_id as "fundingId", 
          quantity,
          price,
          accumulated_income as "accumulatedIncome",
          last_income_update as "lastIncomeUpdate",
          contract_signed as "contractSigned",
          approved
        FROM purchases 
        WHERE contract_signed = true AND approved = true
        ORDER BY funding_id, user_id
      `);

      console.log(`[DailyIncome] Found ${result.rows.length} active purchases`);
      
      return result.rows.map(row => ({
        ...row,
        quantity: parseInt(row.quantity) || 0,
        price: parseFloat(row.price) || 0,
        accumulatedIncome: parseFloat(row.accumulatedIncome) || 0,
        lastIncomeUpdate: new Date(row.lastIncomeUpdate)
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * 단일 구매 건의 수익을 업데이트합니다
   */
  static async updatePurchaseIncome(
    purchaseId: string, 
    newAccumulatedIncome: number
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE purchases 
        SET 
          accumulated_income = $1,
          last_income_update = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newAccumulatedIncome.toString(), purchaseId]);

      return result.rowCount! > 0;
    } finally {
      client.release();
    }
  }

  /**
   * 메인 함수: 모든 활성 구매 건의 일일 수익을 계산하고 업데이트합니다
   */
  static async calculateAndUpdateDailyIncome(): Promise<{
    success: boolean;
    processed: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    console.log('\n=== Daily Income Calculation Started ===');
    console.log(`Time: ${new Date().toISOString()}`);
    
    const startTime = Date.now();
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      // 1. 모든 활성 구매 건 가져오기
      const purchases = await this.getActivePurchases();
      
      if (purchases.length === 0) {
        console.log('[DailyIncome] No active purchases found');
        return { success: true, processed: 0, updated: 0, skipped: 0, errors: [] };
      }

      // 2. 펀딩별로 그룹화하여 처리
      const fundingGroups = purchases.reduce((groups, purchase) => {
        if (!groups[purchase.fundingId]) {
          groups[purchase.fundingId] = [];
        }
        groups[purchase.fundingId].push(purchase);
        return groups;
      }, {} as Record<string, PurchaseRecord[]>);

      console.log(`[DailyIncome] Processing ${Object.keys(fundingGroups).length} funding types:`);
      Object.entries(fundingGroups).forEach(([fundingId, purchases]) => {
        const rateConfig = getIncomeRate(fundingId);
        console.log(`  - ${fundingId}: ${purchases.length} purchases (${rateConfig?.description || 'Unknown rate'})`);
      });

      // 3. 각 구매 건별로 수익 계산 및 업데이트
      for (const purchase of purchases) {
        processed++;
        
        try {
          // 현재 수익률 설정 확인
          const rateConfig = getIncomeRate(purchase.fundingId);
          if (!rateConfig || rateConfig.type === 'disabled') {
            console.log(`[DailyIncome] Skipping ${purchase.id}: ${purchase.fundingId} income disabled`);
            skipped++;
            continue;
          }

          // 일일 수익 계산
          const currentIncome = purchase.accumulatedIncome;
          let newIncome: number;

          if (purchase.fundingId === 'funding-1') {
            // Doge: quantity = mining units
            newIncome = calculateDailyIncome(purchase.fundingId, purchase.quantity, currentIncome);
          } else if (purchase.fundingId === 'funding-2') {
            // Data Center: price = 구매 금액
            newIncome = calculateDailyIncome(purchase.fundingId, purchase.price, currentIncome);
          } else {
            console.log(`[DailyIncome] Skipping ${purchase.id}: ${purchase.fundingId} not configured`);
            skipped++;
            continue;
          }

          // 변화가 있는 경우에만 업데이트
          if (Math.abs(newIncome - currentIncome) < 0.01) {
            console.log(`[DailyIncome] No change for ${purchase.id}: ${currentIncome}`);
            skipped++;
            continue;
          }

          // 데이터베이스 업데이트
          const updateSuccess = await this.updatePurchaseIncome(purchase.id, newIncome);
          
          if (updateSuccess) {
            console.log(`[DailyIncome] Updated ${purchase.id}: ${currentIncome} → ${newIncome}`);
            updated++;
          } else {
            const error = `Failed to update purchase ${purchase.id}`;
            console.error(`[DailyIncome] ${error}`);
            errors.push(error);
          }

        } catch (error) {
          const errorMsg = `Error processing purchase ${purchase.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[DailyIncome] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      console.log('\n=== Daily Income Calculation Completed ===');
      console.log(`Duration: ${duration}ms`);
      console.log(`Processed: ${processed}`);
      console.log(`Updated: ${updated}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.error('Errors encountered:', errors);
      }

      return {
        success: errors.length === 0,
        processed,
        updated,
        skipped,
        errors
      };

    } catch (error) {
      const errorMsg = `Fatal error in daily income calculation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[DailyIncome] ${errorMsg}`);
      errors.push(errorMsg);
      
      return {
        success: false,
        processed,
        updated,
        skipped,
        errors
      };
    }
  }
}