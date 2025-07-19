import pool from '../database';
import { User } from '../fileStorage';

export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, address, confirmed, is_admin as "isAdmin" FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash as password, name, phone, address, confirmed, is_admin as "isAdmin" FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
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
        'SELECT id, email, password_hash as password, name, phone, address, confirmed, is_admin as "isAdmin" FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async updateUser(id: string, updateData: { password?: string; phone?: string; address?: string }): Promise<boolean> {
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

      if (updateData.address !== undefined) {
        setClauses.push(`address = $${paramIndex}`);
        values.push(updateData.address);
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
}