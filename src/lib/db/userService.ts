import pool from '../database';
import { User } from '../fileStorage';

export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      console.log('UserService.findByEmail called for:', email);
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, confirmed, is_admin as "isAdmin" FROM users WHERE email = $1',
        [email]
      );
      console.log('Query result:', result.rows.length > 0 ? 'User found' : 'User not found');
      return result.rows[0] || null;
    } catch (error) {
      console.error('UserService.findByEmail error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      console.log('UserService.findById called for:', id);
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, confirmed, is_admin as "isAdmin", reset_token, reset_token_expiry FROM users WHERE id = $1',
        [id]
      );
      console.log('Query result:', result.rows.length > 0 ? 'User found' : 'User not found');
      return result.rows[0] || null;
    } catch (error) {
      console.error('UserService.findById error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async create(user: User): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO users (id, email, password_hash, name, phone, confirmed, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, user.email, user.password, user.name, user.phone, user.confirmed, user.isAdmin || false]
      );
    } finally {
      client.release();
    }
  }

  static async confirmUser(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE users SET confirmed = true WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async getAll(): Promise<User[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, confirmed, is_admin as "isAdmin" FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async updateUser(id: string, updateData: { password?: string; phone?: string }): Promise<boolean> {
    const client = await pool.connect();
    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      if (updateData.password !== undefined) {
        setClauses.push(`password_hash = $${paramIndex}`);
        values.push(updateData.password);
        paramIndex++;
      }

      if (updateData.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        values.push(updateData.phone);
        paramIndex++;
      }


      if (setClauses.length === 0) {
        return true; // Nothing to update
      }

      values.push(id); // Add id as the last parameter
      const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
      
      const result = await client.query(query, values);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async ensureResetTokenColumns(): Promise<void> {
    const client = await pool.connect();
    try {
      // Check if columns exist and add them if they don't
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
      `);
      
      // Create index if it doesn't exist
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) 
        WHERE reset_token IS NOT NULL;
      `);
    } catch (error) {
      console.error('Error ensuring reset token columns:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async savePasswordResetToken(userId: string, token: string, expiry: Date): Promise<boolean> {
    const client = await pool.connect();
    try {
      // Ensure columns exist first
      await this.ensureResetTokenColumns();
      
      const result = await client.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
        [token, expiry, userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error saving password reset token:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findByResetToken(token: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, confirmed, is_admin as "isAdmin", reset_token, reset_token_expiry FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
        [token]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async clearPasswordResetToken(userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = $1',
        [userId]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
        [newPasswordHash, userId]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }
}