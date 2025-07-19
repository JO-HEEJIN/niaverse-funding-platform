import pool from '../database';

export interface Withdrawal {
  id: number;
  userId: number;
  fundingId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  requestDate: Date;
  processedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class WithdrawalService {
  static async create(withdrawal: { userId: number; fundingId: string; amount: number; status?: string; adminNotes?: string }): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO withdrawal_requests (user_id, funding_id, amount, status, admin_notes) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          withdrawal.userId,
          withdrawal.fundingId,
          withdrawal.amount,
          withdrawal.status || 'pending',
          withdrawal.adminNotes || null
        ]
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  static async getByUserId(userId: number): Promise<Withdrawal[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, user_id as "userId", funding_id as "fundingId", amount, 
                status, admin_notes as "adminNotes", request_date as "requestDate", 
                processed_date as "processedDate", created_at as "createdAt", updated_at as "updatedAt"
         FROM withdrawal_requests 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows.map(row => ({
        ...row,
        requestDate: new Date(row.requestDate),
        processedDate: row.processedDate ? new Date(row.processedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } finally {
      client.release();
    }
  }

  static async getTodayWithdrawalsCount(userId: number): Promise<number> {
    const client = await pool.connect();
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await client.query(
        `SELECT COUNT(*) as count 
         FROM withdrawal_requests 
         WHERE user_id = $1 AND request_date >= $2 AND request_date < $3`,
        [userId, today, tomorrow]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  static async getUserTotalWithdrawals(userId: number): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count 
         FROM withdrawal_requests 
         WHERE user_id = $1 AND status = 'approved'`,
        [userId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  static async getAll(): Promise<Withdrawal[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, user_id as "userId", funding_id as "fundingId", amount, 
                status, admin_notes as "adminNotes", request_date as "requestDate", 
                processed_date as "processedDate", created_at as "createdAt", updated_at as "updatedAt"
         FROM withdrawal_requests 
         ORDER BY created_at DESC`
      );
      return result.rows.map(row => ({
        ...row,
        requestDate: new Date(row.requestDate),
        processedDate: row.processedDate ? new Date(row.processedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } finally {
      client.release();
    }
  }

  static async updateStatus(id: number, status: Withdrawal['status'], adminNotes?: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE withdrawal_requests 
         SET status = $1, processed_date = CURRENT_TIMESTAMP, admin_notes = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [status, adminNotes || null, id]
      );
      return result.rowCount! > 0;
    } finally {
      client.release();
    }
  }
}