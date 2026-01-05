-- Demo Account SQL Script for Home Budget Manager
-- This creates a demo user with sample accounts, categories, and transactions
-- Password for demo user: Demo123!

-- 1. Create Demo User
-- Password hash for "Demo123!" using bcrypt
INSERT INTO "User" (id, email, name, password, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'demo-user-id-001',
  'demo',
  'Demo User',
  'demo',
  true,
  NOW(),
  NOW()
);

-- 2. Create Accounts
INSERT INTO "Account" (id, name, type, balance, "initialBalance", "initialBalanceDate", "userId", "createdAt", "updatedAt")
VALUES
  ('demo-acc-checking', 'Main Checking', 'CHECKING', 5420.50, 5000.00, '2025-01-01', 'demo-user-id-001', NOW(), NOW()),
  ('demo-acc-savings', 'Emergency Fund', 'SAVINGS', 12500.00, 10000.00, '2025-01-01', 'demo-user-id-001', NOW(), NOW()),
  ('demo-acc-credit', 'Credit Card', 'CREDIT_CARD', -850.30, 0.00, '2025-01-01', 'demo-user-id-001', NOW(), NOW()),
  ('demo-acc-cash', 'Cash Wallet', 'CASH', 245.00, 200.00, '2025-01-01', 'demo-user-id-001', NOW(), NOW());

-- 3. Create Categories
INSERT INTO "Category" (id, name, "parentId", "userId", color)
VALUES
  -- Income Categories
  ('demo-cat-salary', 'Salary', NULL, 'demo-user-id-001', '#10b981'),
  ('demo-cat-freelance', 'Freelance', NULL, 'demo-user-id-001', '#3b82f6'),
  
  -- Expense Categories
  ('demo-cat-housing', 'Housing', NULL, 'demo-user-id-001', '#ef4444'),
  ('demo-cat-rent', 'Rent', 'demo-cat-housing', 'demo-user-id-001', '#dc2626'),
  ('demo-cat-utilities', 'Utilities', 'demo-cat-housing', 'demo-user-id-001', '#f97316'),
  
  ('demo-cat-food', 'Food & Dining', NULL, 'demo-user-id-001', '#f59e0b'),
  ('demo-cat-groceries', 'Groceries', 'demo-cat-food', 'demo-user-id-001', '#eab308'),
  ('demo-cat-restaurants', 'Restaurants', 'demo-cat-food', 'demo-user-id-001', '#f59e0b'),
  
  ('demo-cat-transport', 'Transportation', NULL, 'demo-user-id-001', '#8b5cf6'),
  ('demo-cat-fuel', 'Fuel', 'demo-cat-transport', 'demo-user-id-001', '#7c3aed'),
  ('demo-cat-public', 'Public Transport', 'demo-cat-transport', 'demo-user-id-001', '#a78bfa'),
  
  ('demo-cat-shopping', 'Shopping', NULL, 'demo-user-id-001', '#ec4899'),
  ('demo-cat-clothes', 'Clothing', 'demo-cat-shopping', 'demo-user-id-001', '#db2777'),
  ('demo-cat-electronics', 'Electronics', 'demo-cat-shopping', 'demo-user-id-001', '#f472b6'),
  
  ('demo-cat-entertainment', 'Entertainment', NULL, 'demo-user-id-001', '#06b6d4'),
  ('demo-cat-streaming', 'Streaming Services', 'demo-cat-entertainment', 'demo-user-id-001', '#0891b2'),
  ('demo-cat-movies', 'Movies & Events', 'demo-cat-entertainment', 'demo-user-id-001', '#22d3ee'),
  
  ('demo-cat-health', 'Health & Fitness', NULL, 'demo-user-id-001', '#14b8a6'),
  ('demo-cat-gym', 'Gym Membership', 'demo-cat-health', 'demo-user-id-001', '#0d9488'),
  ('demo-cat-pharmacy', 'Pharmacy', 'demo-cat-health', 'demo-user-id-001', '#2dd4bf');

-- 4. Create Tags
INSERT INTO "Tag" (id, name, "userId")
VALUES
  ('demo-tag-recurring', 'Recurring', 'demo-user-id-001'),
  ('demo-tag-essential', 'Essential', 'demo-user-id-001'),
  ('demo-tag-luxury', 'Luxury', 'demo-user-id-001'),
  ('demo-tag-business', 'Business', 'demo-user-id-001'),
  ('demo-tag-tax-deductible', 'Tax Deductible', 'demo-user-id-001');

-- 5. Create Transactions (Last 3 months)

-- INCOME TRANSACTIONS
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  -- January Salary
  ('demo-tx-001', '2025-01-05', 4500.00, 'INCOME', 'Monthly Salary - January', 'Regular paycheck', 'demo-acc-checking', 'demo-cat-salary', 'demo-user-id-001', false, NOW(), NOW()),
  
  -- January Freelance
  ('demo-tx-002', '2025-01-15', 800.00, 'INCOME', 'Freelance Project - Website Design', 'Client: ABC Corp', 'demo-acc-checking', 'demo-cat-freelance', 'demo-user-id-001', false, NOW(), NOW()),
  
  -- February Salary
  ('demo-tx-003', '2025-02-05', 4500.00, 'INCOME', 'Monthly Salary - February', 'Regular paycheck', 'demo-acc-checking', 'demo-cat-salary', 'demo-user-id-001', false, NOW(), NOW()),
  
  -- March Salary
  ('demo-tx-004', '2025-03-05', 4500.00, 'INCOME', 'Monthly Salary - March', 'Regular paycheck', 'demo-acc-checking', 'demo-cat-salary', 'demo-user-id-001', false, NOW(), NOW()),
  
  -- March Freelance
  ('demo-tx-005', '2025-03-20', 1200.00, 'INCOME', 'Freelance Project - Mobile App', 'Client: XYZ Ltd', 'demo-acc-checking', 'demo-cat-freelance', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - HOUSING
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-101', '2025-01-01', 1200.00, 'EXPENSE', 'Rent - January', 'Monthly rent payment', 'demo-acc-checking', 'demo-cat-rent', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-102', '2025-01-10', 85.50, 'EXPENSE', 'Electricity Bill', 'January electricity', 'demo-acc-checking', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-103', '2025-01-15', 45.00, 'EXPENSE', 'Internet Bill', 'Monthly internet', 'demo-acc-credit', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-104', '2025-02-01', 1200.00, 'EXPENSE', 'Rent - February', 'Monthly rent payment', 'demo-acc-checking', 'demo-cat-rent', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-105', '2025-02-10', 92.30, 'EXPENSE', 'Electricity Bill', 'February electricity', 'demo-acc-checking', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-106', '2025-02-15', 45.00, 'EXPENSE', 'Internet Bill', 'Monthly internet', 'demo-acc-credit', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-107', '2025-03-01', 1200.00, 'EXPENSE', 'Rent - March', 'Monthly rent payment', 'demo-acc-checking', 'demo-cat-rent', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-108', '2025-03-10', 78.20, 'EXPENSE', 'Electricity Bill', 'March electricity', 'demo-acc-checking', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-109', '2025-03-15', 45.00, 'EXPENSE', 'Internet Bill', 'Monthly internet', 'demo-acc-credit', 'demo-cat-utilities', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - FOOD
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-201', '2025-01-03', 125.40, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-202', '2025-01-08', 45.80, 'EXPENSE', 'Restaurant - Italian', 'Dinner with friends', 'demo-acc-credit', 'demo-cat-restaurants', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-203', '2025-01-12', 98.50, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-204', '2025-01-18', 32.00, 'EXPENSE', 'Fast Food', 'Lunch break', 'demo-acc-cash', 'demo-cat-restaurants', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-205', '2025-01-22', 110.20, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-206', '2025-01-28', 67.50, 'EXPENSE', 'Restaurant - Asian', 'Date night', 'demo-acc-credit', 'demo-cat-restaurants', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-207', '2025-02-05', 132.90, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-208', '2025-02-12', 89.30, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-209', '2025-02-14', 95.00, 'EXPENSE', 'Restaurant - French', 'Valentine''s dinner', 'demo-acc-credit', 'demo-cat-restaurants', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-210', '2025-02-20', 105.60, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-211', '2025-03-03', 118.70, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-212', '2025-03-10', 42.50, 'EXPENSE', 'Restaurant - Pizza', 'Weekend treat', 'demo-acc-cash', 'demo-cat-restaurants', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-213', '2025-03-17', 95.80, 'EXPENSE', 'Grocery Shopping', 'Weekly groceries', 'demo-acc-checking', 'demo-cat-groceries', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - TRANSPORTATION
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-301', '2025-01-07', 55.00, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-302', '2025-01-14', 12.50, 'EXPENSE', 'Metro Card', 'Weekly pass', 'demo-acc-cash', 'demo-cat-public', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-303', '2025-01-21', 58.30, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-304', '2025-02-04', 52.00, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-305', '2025-02-11', 12.50, 'EXPENSE', 'Metro Card', 'Weekly pass', 'demo-acc-cash', 'demo-cat-public', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-306', '2025-02-18', 60.00, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-307', '2025-03-06', 57.50, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-308', '2025-03-13', 12.50, 'EXPENSE', 'Metro Card', 'Weekly pass', 'demo-acc-cash', 'demo-cat-public', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-309', '2025-03-20', 54.80, 'EXPENSE', 'Gas Station', 'Full tank', 'demo-acc-credit', 'demo-cat-fuel', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - SHOPPING
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-401', '2025-01-20', 89.99, 'EXPENSE', 'New Jeans', 'Winter sale', 'demo-acc-credit', 'demo-cat-clothes', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-402', '2025-02-14', 299.00, 'EXPENSE', 'Wireless Headphones', 'Birthday gift to myself', 'demo-acc-credit', 'demo-cat-electronics', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-403', '2025-03-08', 45.50, 'EXPENSE', 'T-Shirts', 'Spring collection', 'demo-acc-credit', 'demo-cat-clothes', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - ENTERTAINMENT
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-501', '2025-01-01', 15.99, 'EXPENSE', 'Netflix Subscription', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-502', '2025-01-10', 12.99, 'EXPENSE', 'Spotify Premium', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-503', '2025-01-25', 45.00, 'EXPENSE', 'Concert Tickets', 'Local band', 'demo-acc-credit', 'demo-cat-movies', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-504', '2025-02-01', 15.99, 'EXPENSE', 'Netflix Subscription', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-505', '2025-02-10', 12.99, 'EXPENSE', 'Spotify Premium', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-506', '2025-02-22', 28.00, 'EXPENSE', 'Movie Theater', 'Weekend movie', 'demo-acc-cash', 'demo-cat-movies', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-507', '2025-03-01', 15.99, 'EXPENSE', 'Netflix Subscription', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-508', '2025-03-10', 12.99, 'EXPENSE', 'Spotify Premium', 'Monthly subscription', 'demo-acc-credit', 'demo-cat-streaming', 'demo-user-id-001', false, NOW(), NOW());

-- EXPENSE TRANSACTIONS - HEALTH
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-601', '2025-01-05', 49.99, 'EXPENSE', 'Gym Membership', 'Monthly membership', 'demo-acc-checking', 'demo-cat-gym', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-602', '2025-01-18', 25.80, 'EXPENSE', 'Pharmacy', 'Vitamins and supplements', 'demo-acc-cash', 'demo-cat-pharmacy', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-603', '2025-02-05', 49.99, 'EXPENSE', 'Gym Membership', 'Monthly membership', 'demo-acc-checking', 'demo-cat-gym', 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-604', '2025-02-25', 18.50, 'EXPENSE', 'Pharmacy', 'Cold medicine', 'demo-acc-cash', 'demo-cat-pharmacy', 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-605', '2025-03-05', 49.99, 'EXPENSE', 'Gym Membership', 'Monthly membership', 'demo-acc-checking', 'demo-cat-gym', 'demo-user-id-001', false, NOW(), NOW());

-- 6. Create Transfer (Savings)
INSERT INTO "Transaction" (id, date, amount, type, description, notes, "accountId", "categoryId", "userId", "isParent", "createdAt", "updatedAt")
VALUES
  ('demo-tx-transfer-1a', '2025-01-10', 500.00, 'TRANSFER', 'Transfer to Savings', 'Monthly savings', 'demo-acc-checking', NULL, 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-transfer-1b', '2025-01-10', 500.00, 'TRANSFER', 'Transfer from Checking', 'Monthly savings', 'demo-acc-savings', NULL, 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-transfer-2a', '2025-02-10', 500.00, 'TRANSFER', 'Transfer to Savings', 'Monthly savings', 'demo-acc-checking', NULL, 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-transfer-2b', '2025-02-10', 500.00, 'TRANSFER', 'Transfer from Checking', 'Monthly savings', 'demo-acc-savings', NULL, 'demo-user-id-001', false, NOW(), NOW()),
  
  ('demo-tx-transfer-3a', '2025-03-10', 500.00, 'TRANSFER', 'Transfer to Savings', 'Monthly savings', 'demo-acc-checking', NULL, 'demo-user-id-001', false, NOW(), NOW()),
  ('demo-tx-transfer-3b', '2025-03-10', 500.00, 'TRANSFER', 'Transfer from Checking', 'Monthly savings', 'demo-acc-savings', NULL, 'demo-user-id-001', false, NOW(), NOW());

-- Link transfers
INSERT INTO "Transfer" (id, "transactionId", "fromAccountId", "toAccountId", "createdAt")
VALUES
  ('demo-transfer-1', 'demo-tx-transfer-1a', 'demo-acc-checking', 'demo-acc-savings', NOW()),
  ('demo-transfer-2', 'demo-tx-transfer-2a', 'demo-acc-checking', 'demo-acc-savings', NOW()),
  ('demo-transfer-3', 'demo-tx-transfer-3a', 'demo-acc-checking', 'demo-acc-savings', NOW());

-- 7. Add Tags to Transactions
INSERT INTO "TransactionTag" ("transactionId", "tagId")
VALUES
  -- Recurring transactions
  ('demo-tx-001', 'demo-tag-recurring'),
  ('demo-tx-003', 'demo-tag-recurring'),
  ('demo-tx-004', 'demo-tag-recurring'),
  ('demo-tx-101', 'demo-tag-recurring'),
  ('demo-tx-104', 'demo-tag-recurring'),
  ('demo-tx-107', 'demo-tag-recurring'),
  ('demo-tx-501', 'demo-tag-recurring'),
  ('demo-tx-502', 'demo-tag-recurring'),
  ('demo-tx-504', 'demo-tag-recurring'),
  ('demo-tx-505', 'demo-tag-recurring'),
  ('demo-tx-507', 'demo-tag-recurring'),
  ('demo-tx-508', 'demo-tag-recurring'),
  ('demo-tx-601', 'demo-tag-recurring'),
  ('demo-tx-603', 'demo-tag-recurring'),
  ('demo-tx-605', 'demo-tag-recurring'),
  
  -- Essential transactions
  ('demo-tx-101', 'demo-tag-essential'),
  ('demo-tx-104', 'demo-tag-essential'),
  ('demo-tx-107', 'demo-tag-essential'),
  ('demo-tx-102', 'demo-tag-essential'),
  ('demo-tx-105', 'demo-tag-essential'),
  ('demo-tx-108', 'demo-tag-essential'),
  ('demo-tx-201', 'demo-tag-essential'),
  ('demo-tx-203', 'demo-tag-essential'),
  ('demo-tx-205', 'demo-tag-essential'),
  
  -- Luxury transactions
  ('demo-tx-206', 'demo-tag-luxury'),
  ('demo-tx-209', 'demo-tag-luxury'),
  ('demo-tx-402', 'demo-tag-luxury'),
  ('demo-tx-503', 'demo-tag-luxury'),
  
  -- Business/Tax deductible
  ('demo-tx-002', 'demo-tag-business'),
  ('demo-tx-002', 'demo-tag-tax-deductible'),
  ('demo-tx-005', 'demo-tag-business'),
  ('demo-tx-005', 'demo-tag-tax-deductible');

-- Summary of demo data:
-- User: demo@budgetmanager.local / Demo123!
-- 4 Accounts (Checking, Savings, Credit Card, Cash)
-- 20 Categories (with subcategories)
-- 5 Tags
-- 60+ Transactions over 3 months
-- 3 Transfers between accounts
-- Realistic spending patterns with recurring bills
