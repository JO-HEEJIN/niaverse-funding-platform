import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  confirmed: boolean;
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
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

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
}

export const fileStorage = new FileStorage();