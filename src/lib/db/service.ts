import { db } from './index';
import { users, purchases, withdrawalRequests, transactions } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  User, 
  NewUser, 
  Purchase, 
  NewPurchase, 
  WithdrawalRequest, 
  NewWithdrawalRequest,
  Transaction,
  NewTransaction 
} from './schema';

export class DatabaseService {
  // User methods
  async addUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async confirmUser(id: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ confirmed: true })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Purchase methods
  async addPurchase(purchaseData: NewPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(purchaseData).returning();
    return purchase;
  }

  async findPurchasesByUserId(userId: number): Promise<Purchase[]> {
    return db.select().from(purchases).where(eq(purchases.userId, userId));
  }

  async findPurchaseById(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async updatePurchaseContract(id: number, contractData: Record<string, any>): Promise<boolean> {
    const result = await db
      .update(purchases)
      .set({ 
        contractData, 
        contractSigned: true,
        updatedAt: new Date() 
      })
      .where(eq(purchases.id, id));
    return result.rowCount > 0;
  }

  async updatePurchaseIncome(id: number, income: string): Promise<boolean> {
    const result = await db
      .update(purchases)
      .set({ 
        accumulatedIncome: income,
        lastIncomeUpdate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(purchases.id, id));
    return result.rowCount > 0;
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return db.select().from(purchases);
  }

  // Withdrawal methods
  async addWithdrawal(withdrawalData: NewWithdrawalRequest): Promise<WithdrawalRequest> {
    const [withdrawal] = await db.insert(withdrawalRequests).values(withdrawalData).returning();
    return withdrawal;
  }

  async findWithdrawalsByUserId(userId: number): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
  }

  async updateWithdrawalStatus(
    id: number, 
    status: 'pending' | 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<boolean> {
    const result = await db
      .update(withdrawalRequests)
      .set({ 
        status,
        adminNotes,
        processedDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(withdrawalRequests.id, id));
    return result.rowCount > 0;
  }

  async getAllWithdrawals(): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
  }

  // Transaction methods
  async addTransaction(transactionData: NewTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  async findTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }
}

export const databaseService = new DatabaseService();