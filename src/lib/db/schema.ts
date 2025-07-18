import { pgTable, serial, varchar, text, boolean, timestamp, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  confirmed: boolean('confirmed').default(false),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}));

// Purchases table
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  fundingId: varchar('funding_id', { length: 10 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  contractSigned: boolean('contract_signed').default(false),
  contractData: jsonb('contract_data'),
  accumulatedIncome: decimal('accumulated_income', { precision: 12, scale: 2 }).default('0'),
  lastIncomeUpdate: timestamp('last_income_update', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_purchases_user_id').on(table.userId),
  fundingIdIdx: index('idx_purchases_funding_id').on(table.fundingId),
}));

// Withdrawal requests table
export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  fundingId: varchar('funding_id', { length: 10 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  adminNotes: text('admin_notes'),
  requestDate: timestamp('request_date', { withTimezone: true }).defaultNow(),
  processedDate: timestamp('processed_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_withdrawal_requests_user_id').on(table.userId),
  statusIdx: index('idx_withdrawal_requests_status').on(table.status),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  fundingId: varchar('funding_id', { length: 10 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_transactions_user_id').on(table.userId),
  typeIdx: index('idx_transactions_type').on(table.type),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
  withdrawalRequests: many(withdrawalRequests),
  transactions: many(transactions),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type NewWithdrawalRequest = typeof withdrawalRequests.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;