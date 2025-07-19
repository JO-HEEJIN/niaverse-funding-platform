import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  confirmed: boolean;
  isAdmin?: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  fundingId: string;
  quantity: number;
  price: number;
  timestamp: Date;
  contractSigned: boolean;
  contractData?: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    signature: string;
  };
  accumulatedIncome: number;
  lastIncomeUpdate: Date;
  // Approval fields
  approved?: boolean;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  fundingId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
  adminNotes?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'withdrawal';
  amount: number;
  fundingId: string;
  timestamp: Date;
  details: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileStorage {
  private loadUsers(): User[] {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return [];
  }

  private saveUsers(users: User[]): void {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private loadPurchases(): Purchase[] {
    try {
      if (fs.existsSync(PURCHASES_FILE)) {
        const data = fs.readFileSync(PURCHASES_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
    return [];
  }

  private savePurchases(purchases: Purchase[]): void {
    try {
      fs.writeFileSync(PURCHASES_FILE, JSON.stringify(purchases, null, 2));
    } catch (error) {
      console.error('Error saving purchases:', error);
    }
  }

  // User methods
  addUser(user: User): void {
    const users = this.loadUsers();
    users.push(user);
    this.saveUsers(users);
  }

  findUserByEmail(email: string): User | undefined {
    const users = this.loadUsers();
    return users.find(user => user.email === email);
  }

  findUserById(id: string): User | undefined {
    const users = this.loadUsers();
    return users.find(user => user.id === id);
  }

  confirmUser(id: string): boolean {
    const users = this.loadUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.confirmed = true;
      this.saveUsers(users);
      return true;
    }
    return false;
  }

  getAllUsers(): User[] {
    return this.loadUsers();
  }

  // Purchase methods
  addPurchase(purchase: Purchase): void {
    const purchases = this.loadPurchases();
    purchases.push(purchase);
    this.savePurchases(purchases);
  }

  findPurchasesByUserId(userId: string): Purchase[] {
    const purchases = this.loadPurchases();
    return purchases.filter(purchase => purchase.userId === userId);
  }

  findPurchaseById(id: string): Purchase | undefined {
    const purchases = this.loadPurchases();
    return purchases.find(purchase => purchase.id === id);
  }

  updatePurchaseContract(id: string, contractData: Purchase['contractData']): boolean {
    const purchases = this.loadPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
      purchase.contractData = contractData;
      purchase.contractSigned = true;
      this.savePurchases(purchases);
      return true;
    }
    return false;
  }

  getAllPurchases(): Purchase[] {
    return this.loadPurchases();
  }

  updatePurchaseIncome(id: string, income: number): boolean {
    const purchases = this.loadPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
      purchase.accumulatedIncome = income;
      purchase.lastIncomeUpdate = new Date();
      this.savePurchases(purchases);
      return true;
    }
    return false;
  }

  // Withdrawal methods
  private loadWithdrawals(): WithdrawalRequest[] {
    try {
      if (fs.existsSync(WITHDRAWALS_FILE)) {
        const data = fs.readFileSync(WITHDRAWALS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
    return [];
  }

  private saveWithdrawals(withdrawals: WithdrawalRequest[]): void {
    try {
      fs.writeFileSync(WITHDRAWALS_FILE, JSON.stringify(withdrawals, null, 2));
    } catch (error) {
      console.error('Error saving withdrawals:', error);
    }
  }

  addWithdrawal(withdrawal: WithdrawalRequest): void {
    const withdrawals = this.loadWithdrawals();
    withdrawals.push(withdrawal);
    this.saveWithdrawals(withdrawals);
  }

  findWithdrawalsByUserId(userId: string): WithdrawalRequest[] {
    const withdrawals = this.loadWithdrawals();
    return withdrawals.filter(w => w.userId === userId);
  }

  updateWithdrawalStatus(id: string, status: WithdrawalRequest['status'], adminNotes?: string): boolean {
    const withdrawals = this.loadWithdrawals();
    const withdrawal = withdrawals.find(w => w.id === id);
    if (withdrawal) {
      withdrawal.status = status;
      withdrawal.processedDate = new Date();
      if (adminNotes) withdrawal.adminNotes = adminNotes;
      this.saveWithdrawals(withdrawals);
      return true;
    }
    return false;
  }

  getAllWithdrawals(): WithdrawalRequest[] {
    return this.loadWithdrawals();
  }

  // Transaction methods
  private loadTransactions(): Transaction[] {
    try {
      if (fs.existsSync(TRANSACTIONS_FILE)) {
        const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    return [];
  }

  private saveTransactions(transactions: Transaction[]): void {
    try {
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  addTransaction(transaction: Transaction): void {
    const transactions = this.loadTransactions();
    transactions.push(transaction);
    this.saveTransactions(transactions);
  }

  findTransactionsByUserId(userId: string): Transaction[] {
    const transactions = this.loadTransactions();
    return transactions.filter(t => t.userId === userId);
  }
}

export const fileStorage = new FileStorage();