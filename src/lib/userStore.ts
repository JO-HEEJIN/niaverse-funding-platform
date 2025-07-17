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

class UserStore {
  private users: User[] = [];
  private purchases: Purchase[] = [];

  // User methods
  addUser(user: User): void {
    this.users.push(user);
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  confirmUser(id: string): boolean {
    const user = this.findUserById(id);
    if (user) {
      user.confirmed = true;
      return true;
    }
    return false;
  }

  // Purchase methods
  addPurchase(purchase: Purchase): void {
    this.purchases.push(purchase);
  }

  findPurchasesByUserId(userId: string): Purchase[] {
    return this.purchases.filter(purchase => purchase.userId === userId);
  }

  findPurchaseById(id: string): Purchase | undefined {
    return this.purchases.find(purchase => purchase.id === id);
  }

  updatePurchaseContract(id: string, contractData: Purchase['contractData']): boolean {
    const purchase = this.findPurchaseById(id);
    if (purchase) {
      purchase.contractData = contractData;
      purchase.contractSigned = true;
      return true;
    }
    return false;
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getAllPurchases(): Purchase[] {
    return this.purchases;
  }
}

export const userStore = new UserStore();