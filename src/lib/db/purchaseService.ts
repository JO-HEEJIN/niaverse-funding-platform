import pool from '../database';
import { Purchase } from '../fileStorage';

export class PurchaseService {
  static async findByUserId(userId: string): Promise<Purchase[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, user_id as "userId", funding_id as "fundingId", quantity, price, contract_signed as "contractSigned", contract_data as "contractData", accumulated_income as "accumulatedIncome", last_income_update as "lastIncomeUpdate", approved, approved_at as "approvedAt", approved_by as "approvedBy", created_at as timestamp FROM purchases WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows.map(row => ({
        ...row,
        timestamp: new Date(row.timestamp),
        lastIncomeUpdate: new Date(row.lastIncomeUpdate)
      }));
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<Purchase | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, user_id as "userId", funding_id as "fundingId", quantity, price, contract_signed as "contractSigned", contract_data as "contractData", accumulated_income as "accumulatedIncome", last_income_update as "lastIncomeUpdate", created_at as timestamp FROM purchases WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        timestamp: new Date(row.timestamp),
        lastIncomeUpdate: new Date(row.lastIncomeUpdate)
      };
    } finally {
      client.release();
    }
  }

  static async create(purchase: Purchase): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO purchases (id, user_id, funding_id, quantity, price, contract_signed, contract_data, accumulated_income, last_income_update, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [
          purchase.id,
          purchase.userId,
          purchase.fundingId,
          purchase.quantity,
          purchase.price,
          purchase.contractSigned,
          JSON.stringify(purchase.contractData || {}),
          purchase.accumulatedIncome || 0,
          purchase.lastIncomeUpdate || new Date(),
          false // 기본값: 승인되지 않음
        ]
      );
    } finally {
      client.release();
    }
  }

  static async updateContract(id: string, contractData: Purchase['contractData']): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE purchases SET contract_data = $1, contract_signed = true WHERE id = $2',
        [JSON.stringify(contractData), id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async updateIncome(id: string, income: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE purchases SET accumulated_income = $1, last_income_update = CURRENT_TIMESTAMP WHERE id = $2',
        [income, id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async getAll(): Promise<Purchase[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, user_id as "userId", funding_id as "fundingId", quantity, price, contract_signed as "contractSigned", contract_data as "contractData", accumulated_income as "accumulatedIncome", last_income_update as "lastIncomeUpdate", approved, approved_at as "approvedAt", approved_by as "approvedBy", created_at as timestamp FROM purchases ORDER BY created_at DESC'
      );
      return result.rows.map(row => ({
        ...row,
        timestamp: new Date(row.timestamp),
        lastIncomeUpdate: new Date(row.lastIncomeUpdate)
      }));
    } finally {
      client.release();
    }
  }

  static async approvePurchase(id: string, approvedBy: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE purchases SET approved = true, approved_at = CURRENT_TIMESTAMP, approved_by = $1 WHERE id = $2',
        [approvedBy, id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async getByUserId(userId: string): Promise<Purchase[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, user_id as "userId", funding_id as "fundingId", quantity, price, contract_signed as "contractSigned", contract_data as "contractData", accumulated_income as "accumulatedIncome", last_income_update as "lastIncomeUpdate", approved, approved_at as "approvedAt", approved_by as "approvedBy", created_at as timestamp FROM purchases WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows.map(row => ({
        ...row,
        timestamp: new Date(row.timestamp),
        lastIncomeUpdate: row.lastIncomeUpdate ? new Date(row.lastIncomeUpdate) : null
      }));
    } finally {
      client.release();
    }
  }
}