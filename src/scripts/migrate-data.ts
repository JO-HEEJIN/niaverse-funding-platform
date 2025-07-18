import { db, users, purchases, withdrawalRequests, transactions } from '../lib/db';
import { fileStorage } from '../lib/fileStorage';
import 'dotenv/config';

async function migrateData() {
  console.log('🚀 Starting data migration...');

  try {
    // Migrate users
    console.log('📊 Migrating users...');
    const existingUsers = fileStorage.getAllUsers();
    
    for (const user of existingUsers) {
      await db.insert(users).values({
        email: user.email,
        passwordHash: user.password,
        name: user.name,
        phone: user.phone || '00000000000', // Default phone for existing users
        confirmed: user.confirmed,
        isAdmin: user.isAdmin || false,
      }).onConflictDoNothing();
    }
    
    console.log(`✅ Migrated ${existingUsers.length} users`);

    // Get user ID mappings
    const dbUsers = await db.select().from(users);
    const userIdMap = new Map<string, number>();
    
    for (const user of existingUsers) {
      const dbUser = dbUsers.find(u => u.email === user.email);
      if (dbUser) {
        userIdMap.set(user.id, dbUser.id);
      }
    }

    // Migrate purchases
    console.log('📊 Migrating purchases...');
    const existingPurchases = fileStorage.getAllPurchases();
    
    for (const purchase of existingPurchases) {
      const dbUserId = userIdMap.get(purchase.userId);
      if (dbUserId) {
        await db.insert(purchases).values({
          userId: dbUserId,
          fundingId: purchase.fundingId,
          quantity: purchase.quantity,
          price: purchase.price.toString(),
          contractSigned: purchase.contractSigned,
          contractData: purchase.contractData,
          accumulatedIncome: (purchase.accumulatedIncome || 0).toString(),
          lastIncomeUpdate: new Date(purchase.lastIncomeUpdate || purchase.timestamp),
          createdAt: new Date(purchase.timestamp),
        }).onConflictDoNothing();
      }
    }
    
    console.log(`✅ Migrated ${existingPurchases.length} purchases`);

    // Migrate withdrawal requests
    console.log('📊 Migrating withdrawal requests...');
    const existingWithdrawals = fileStorage.getAllWithdrawals();
    
    for (const withdrawal of existingWithdrawals) {
      const dbUserId = userIdMap.get(withdrawal.userId);
      if (dbUserId) {
        await db.insert(withdrawalRequests).values({
          userId: dbUserId,
          fundingId: withdrawal.fundingId,
          amount: withdrawal.amount.toString(),
          status: withdrawal.status,
          adminNotes: withdrawal.adminNotes,
          requestDate: new Date(withdrawal.requestDate),
          processedDate: withdrawal.processedDate ? new Date(withdrawal.processedDate) : null,
        }).onConflictDoNothing();
      }
    }
    
    console.log(`✅ Migrated ${existingWithdrawals.length} withdrawal requests`);

    // Create transactions from purchases
    console.log('📊 Creating transaction records...');
    const dbPurchases = await db.select().from(purchases);
    
    for (const purchase of dbPurchases) {
      if (purchase.contractSigned && purchase.userId) {
        await db.insert(transactions).values({
          userId: purchase.userId,
          fundingId: purchase.fundingId,
          type: 'purchase',
          amount: purchase.price,
          details: `Purchased ${purchase.quantity} units`,
          createdAt: purchase.createdAt || new Date(),
        }).onConflictDoNothing();
      }
    }
    
    console.log(`✅ Created ${dbPurchases.length} transaction records`);

    console.log('🎉 Data migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();