import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'user@budgetmanager.local' },
    update: {},
    create: {
      email: 'user@budgetmanager.local',
      name: 'Default User',
    },
  });

  console.log(`Created/found user: ${user.name} (${user.id})`);

  // Create sample categories
  const categories = [
    // Income categories
    { name: 'Salary', color: '#10b981', parentId: null },
    { name: 'Freelance', color: '#10b981', parentId: null },
    { name: 'Investments', color: '#10b981', parentId: null },
    { name: 'Other Income', color: '#10b981', parentId: null },
    
    // Expense categories - Housing
    { name: 'Housing', color: '#ef4444', parentId: null },
    { name: 'Rent/Mortgage', color: '#ef4444', parentId: 'Housing' },
    { name: 'Utilities', color: '#ef4444', parentId: 'Housing' },
    { name: 'Home Maintenance', color: '#ef4444', parentId: 'Housing' },
    
    // Expense categories - Transportation
    { name: 'Transportation', color: '#f59e0b', parentId: null },
    { name: 'Gas/Fuel', color: '#f59e0b', parentId: 'Transportation' },
    { name: 'Public Transit', color: '#f59e0b', parentId: 'Transportation' },
    { name: 'Car Maintenance', color: '#f59e0b', parentId: 'Transportation' },
    { name: 'Parking', color: '#f59e0b', parentId: 'Transportation' },
    
    // Expense categories - Food
    { name: 'Food & Dining', color: '#8b5cf6', parentId: null },
    { name: 'Groceries', color: '#8b5cf6', parentId: 'Food & Dining' },
    { name: 'Restaurants', color: '#8b5cf6', parentId: 'Food & Dining' },
    { name: 'Coffee Shops', color: '#8b5cf6', parentId: 'Food & Dining' },
    
    // Expense categories - Shopping
    { name: 'Shopping', color: '#ec4899', parentId: null },
    { name: 'Clothing', color: '#ec4899', parentId: 'Shopping' },
    { name: 'Electronics', color: '#ec4899', parentId: 'Shopping' },
    { name: 'Home Goods', color: '#ec4899', parentId: 'Shopping' },
    
    // Expense categories - Entertainment
    { name: 'Entertainment', color: '#06b6d4', parentId: null },
    { name: 'Movies & Shows', color: '#06b6d4', parentId: 'Entertainment' },
    { name: 'Hobbies', color: '#06b6d4', parentId: 'Entertainment' },
    { name: 'Sports', color: '#06b6d4', parentId: 'Entertainment' },
    
    // Expense categories - Health
    { name: 'Health & Fitness', color: '#14b8a6', parentId: null },
    { name: 'Medical', color: '#14b8a6', parentId: 'Health & Fitness' },
    { name: 'Pharmacy', color: '#14b8a6', parentId: 'Health & Fitness' },
    { name: 'Gym', color: '#14b8a6', parentId: 'Health & Fitness' },
    
    // Expense categories - Personal Care
    { name: 'Personal Care', color: '#a855f7', parentId: null },
    { name: 'Haircut', color: '#a855f7', parentId: 'Personal Care' },
    { name: 'Cosmetics', color: '#a855f7', parentId: 'Personal Care' },
    
    // Expense categories - Education
    { name: 'Education', color: '#3b82f6', parentId: null },
    { name: 'Tuition', color: '#3b82f6', parentId: 'Education' },
    { name: 'Books', color: '#3b82f6', parentId: 'Education' },
    { name: 'Courses', color: '#3b82f6', parentId: 'Education' },
    
    // Expense categories - Bills & Utilities
    { name: 'Bills & Utilities', color: '#f97316', parentId: null },
    { name: 'Phone', color: '#f97316', parentId: 'Bills & Utilities' },
    { name: 'Internet', color: '#f97316', parentId: 'Bills & Utilities' },
    { name: 'Subscriptions', color: '#f97316', parentId: 'Bills & Utilities' },
    
    // Expense categories - Insurance
    { name: 'Insurance', color: '#64748b', parentId: null },
    { name: 'Health Insurance', color: '#64748b', parentId: 'Insurance' },
    { name: 'Car Insurance', color: '#64748b', parentId: 'Insurance' },
    { name: 'Home Insurance', color: '#64748b', parentId: 'Insurance' },
    
    // Miscellaneous
    { name: 'Gifts & Donations', color: '#84cc16', parentId: null },
    { name: 'Taxes', color: '#dc2626', parentId: null },
    { name: 'Uncategorized', color: '#6b7280', parentId: null },
  ];

  // Create categories with parent-child relationships
  const categoryMap = new Map<string, string>();

  // First pass: create all parent categories
  for (const cat of categories) {
    if (cat.parentId === null) {
      // Check if category already exists
      const existing = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: cat.name,
        },
      });

      if (!existing) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            color: cat.color,
            userId: user.id,
          },
        });
        categoryMap.set(cat.name, category.id);
        console.log(`Created category: ${cat.name}`);
      } else {
        categoryMap.set(cat.name, existing.id);
        console.log(`Category already exists: ${cat.name}`);
      }
    }
  }

  // Second pass: create child categories
  for (const cat of categories) {
    if (cat.parentId !== null) {
      const parentId = categoryMap.get(cat.parentId);
      if (parentId) {
        // Check if category already exists
        const existing = await prisma.category.findFirst({
          where: {
            userId: user.id,
            name: cat.name,
          },
        });

        if (!existing) {
          const category = await prisma.category.create({
            data: {
              name: cat.name,
              color: cat.color,
              userId: user.id,
              parentId: parentId,
            },
          });
          categoryMap.set(cat.name, category.id);
          console.log(`Created subcategory: ${cat.name} under ${cat.parentId}`);
        } else {
          categoryMap.set(cat.name, existing.id);
          console.log(`Subcategory already exists: ${cat.name}`);
        }
      }
    }
  }

  // Create sample accounts
  const accounts = [
    { name: 'Checking Account', type: 'CHECKING', balance: 5420.50 },
    { name: 'Savings Account', type: 'SAVINGS', balance: 15000.00 },
    { name: 'Credit Card', type: 'CREDIT_CARD', balance: -850.25 },
    { name: 'Cash', type: 'CASH', balance: 200.00 },
  ];

  const accountMap = new Map<string, string>();

  for (const acc of accounts) {
    const existing = await prisma.account.findFirst({
      where: {
        userId: user.id,
        name: acc.name,
      },
    });

    if (!existing) {
      const account = await prisma.account.create({
        data: {
          name: acc.name,
          type: acc.type as any,
          balance: acc.balance,
          userId: user.id,
        },
      });
      accountMap.set(acc.name, account.id);
      console.log(`Created account: ${acc.name} with balance $${acc.balance}`);
    } else {
      accountMap.set(acc.name, existing.id);
      console.log(`Account already exists: ${acc.name}`);
    }
  }

  // Create sample tags
  const tags = [
    'work-related',
    'tax-deductible',
    'vacation',
    'gift',
    'emergency',
    'recurring',
    'one-time',
  ];

  const tagMap = new Map<string, string>();

  for (const tagName of tags) {
    const existing = await prisma.tag.findFirst({
      where: {
        userId: user.id,
        name: tagName,
      },
    });

    if (!existing) {
      const tag = await prisma.tag.create({
        data: {
          name: tagName,
          userId: user.id,
        },
      });
      tagMap.set(tagName, tag.id);
      console.log(`Created tag: ${tagName}`);
    } else {
      tagMap.set(tagName, existing.id);
      console.log(`Tag already exists: ${tagName}`);
    }
  }

  // Create sample transactions
  const checkingId = accountMap.get('Checking Account');
  const savingsId = accountMap.get('Savings Account');
  const creditCardId = accountMap.get('Credit Card');
  const cashId = accountMap.get('Cash');

  if (checkingId && savingsId && creditCardId && cashId) {
    const sampleTransactions = [
      // Income transactions
      {
        date: new Date('2024-11-01'),
        amount: 4500.00,
        type: 'INCOME',
        description: 'Monthly Salary',
        accountId: checkingId,
        categoryId: categoryMap.get('Salary'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-05'),
        amount: 800.00,
        type: 'INCOME',
        description: 'Freelance Project Payment',
        accountId: checkingId,
        categoryId: categoryMap.get('Freelance'),
        tags: ['work-related', 'tax-deductible'],
      },
      
      // Housing expenses
      {
        date: new Date('2024-11-01'),
        amount: 1500.00,
        type: 'EXPENSE',
        description: 'Monthly Rent',
        accountId: checkingId,
        categoryId: categoryMap.get('Rent/Mortgage'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-03'),
        amount: 120.50,
        type: 'EXPENSE',
        description: 'Electric Bill',
        accountId: checkingId,
        categoryId: categoryMap.get('Utilities'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-03'),
        amount: 65.00,
        type: 'EXPENSE',
        description: 'Water Bill',
        accountId: checkingId,
        categoryId: categoryMap.get('Utilities'),
        tags: ['recurring'],
      },
      
      // Transportation
      {
        date: new Date('2024-11-02'),
        amount: 55.00,
        type: 'EXPENSE',
        description: 'Gas Station',
        accountId: creditCardId,
        categoryId: categoryMap.get('Gas/Fuel'),
        tags: [],
      },
      {
        date: new Date('2024-11-06'),
        amount: 45.00,
        type: 'EXPENSE',
        description: 'Gas Station',
        accountId: creditCardId,
        categoryId: categoryMap.get('Gas/Fuel'),
        tags: [],
      },
      {
        date: new Date('2024-11-04'),
        amount: 25.00,
        type: 'EXPENSE',
        description: 'Metro Card Refill',
        accountId: cashId,
        categoryId: categoryMap.get('Public Transit'),
        tags: ['recurring'],
      },
      
      // Food & Dining
      {
        date: new Date('2024-11-02'),
        amount: 125.80,
        type: 'EXPENSE',
        description: 'Whole Foods Market',
        accountId: creditCardId,
        categoryId: categoryMap.get('Groceries'),
        tags: [],
      },
      {
        date: new Date('2024-11-05'),
        amount: 89.50,
        type: 'EXPENSE',
        description: 'Trader Joes',
        accountId: creditCardId,
        categoryId: categoryMap.get('Groceries'),
        tags: [],
      },
      {
        date: new Date('2024-11-03'),
        amount: 45.00,
        type: 'EXPENSE',
        description: 'Italian Restaurant',
        accountId: creditCardId,
        categoryId: categoryMap.get('Restaurants'),
        tags: [],
      },
      {
        date: new Date('2024-11-07'),
        amount: 32.50,
        type: 'EXPENSE',
        description: 'Thai Food Delivery',
        accountId: creditCardId,
        categoryId: categoryMap.get('Restaurants'),
        tags: [],
      },
      {
        date: new Date('2024-11-04'),
        amount: 5.50,
        type: 'EXPENSE',
        description: 'Starbucks',
        accountId: cashId,
        categoryId: categoryMap.get('Coffee Shops'),
        tags: [],
      },
      {
        date: new Date('2024-11-06'),
        amount: 4.75,
        type: 'EXPENSE',
        description: 'Local Coffee Shop',
        accountId: cashId,
        categoryId: categoryMap.get('Coffee Shops'),
        tags: [],
      },
      
      // Shopping
      {
        date: new Date('2024-11-05'),
        amount: 89.99,
        type: 'EXPENSE',
        description: 'Amazon - USB Hub',
        accountId: creditCardId,
        categoryId: categoryMap.get('Electronics'),
        tags: ['work-related'],
      },
      {
        date: new Date('2024-11-07'),
        amount: 125.00,
        type: 'EXPENSE',
        description: 'Department Store - Clothing',
        accountId: creditCardId,
        categoryId: categoryMap.get('Clothing'),
        tags: [],
      },
      
      // Entertainment
      {
        date: new Date('2024-11-06'),
        amount: 15.99,
        type: 'EXPENSE',
        description: 'Netflix Subscription',
        accountId: creditCardId,
        categoryId: categoryMap.get('Movies & Shows'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-08'),
        amount: 45.00,
        type: 'EXPENSE',
        description: 'Movie Theater Tickets',
        accountId: cashId,
        categoryId: categoryMap.get('Movies & Shows'),
        tags: [],
      },
      
      // Health & Fitness
      {
        date: new Date('2024-11-01'),
        amount: 50.00,
        type: 'EXPENSE',
        description: 'Gym Membership',
        accountId: checkingId,
        categoryId: categoryMap.get('Gym'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-04'),
        amount: 25.00,
        type: 'EXPENSE',
        description: 'Pharmacy - Vitamins',
        accountId: cashId,
        categoryId: categoryMap.get('Pharmacy'),
        tags: [],
      },
      
      // Bills & Utilities
      {
        date: new Date('2024-11-01'),
        amount: 60.00,
        type: 'EXPENSE',
        description: 'Mobile Phone Bill',
        accountId: checkingId,
        categoryId: categoryMap.get('Phone'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-01'),
        amount: 80.00,
        type: 'EXPENSE',
        description: 'Internet Service',
        accountId: checkingId,
        categoryId: categoryMap.get('Internet'),
        tags: ['recurring'],
      },
      {
        date: new Date('2024-11-05'),
        amount: 12.99,
        type: 'EXPENSE',
        description: 'Spotify Premium',
        accountId: creditCardId,
        categoryId: categoryMap.get('Subscriptions'),
        tags: ['recurring'],
      },
      
      // Insurance
      {
        date: new Date('2024-11-01'),
        amount: 150.00,
        type: 'EXPENSE',
        description: 'Car Insurance Premium',
        accountId: checkingId,
        categoryId: categoryMap.get('Car Insurance'),
        tags: ['recurring'],
      },
      
      // Gifts
      {
        date: new Date('2024-11-08'),
        amount: 75.00,
        type: 'EXPENSE',
        description: 'Birthday Gift',
        accountId: creditCardId,
        categoryId: categoryMap.get('Gifts & Donations'),
        tags: ['gift', 'one-time'],
      },
      
      // Transfer between accounts
      {
        date: new Date('2024-11-02'),
        amount: 500.00,
        type: 'TRANSFER',
        description: 'Transfer to Savings',
        accountId: checkingId,
        categoryId: null,
        tags: [],
        isTransfer: true,
        toAccountId: savingsId,
      },
    ];

    for (const txn of sampleTransactions) {
      // Check if similar transaction already exists
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: user.id,
          date: txn.date,
          amount: txn.amount,
          description: txn.description,
        },
      });

      if (!existing) {
        const transaction = await prisma.transaction.create({
          data: {
            date: txn.date,
            amount: txn.amount,
            type: txn.type as any,
            description: txn.description,
            accountId: txn.accountId,
            categoryId: txn.categoryId || null,
            userId: user.id,
          },
        });

        // Add tags to transaction
        if (txn.tags && txn.tags.length > 0) {
          for (const tagName of txn.tags) {
            const tagId = tagMap.get(tagName);
            if (tagId) {
              await prisma.transactionTag.create({
                data: {
                  transactionId: transaction.id,
                  tagId: tagId,
                },
              });
            }
          }
        }

        // Handle transfer
        if (txn.isTransfer && txn.toAccountId) {
          await prisma.transfer.create({
            data: {
              transactionId: transaction.id,
              fromAccountId: txn.accountId,
              toAccountId: txn.toAccountId,
            },
          });

          // Create corresponding credit transaction
          await prisma.transaction.create({
            data: {
              date: txn.date,
              amount: txn.amount,
              type: 'TRANSFER',
              description: `Transfer from ${accounts.find(a => accountMap.get(a.name) === txn.accountId)?.name}`,
              accountId: txn.toAccountId,
              userId: user.id,
            },
          });
        }

        console.log(`Created transaction: ${txn.description} - $${txn.amount}`);
      } else {
        console.log(`Transaction already exists: ${txn.description}`);
      }
    }

    // Create a sample split transaction
    const existingSplit = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        description: 'Walmart - Multiple Items',
        isParent: true,
      },
    });

    if (!existingSplit) {
      const splitParent = await prisma.transaction.create({
        data: {
          date: new Date('2024-11-07'),
          amount: 85.50,
          type: 'EXPENSE',
          description: 'Walmart - Multiple Items',
          accountId: creditCardId,
          userId: user.id,
          isParent: true,
        },
      });

      const splitItems = [
        {
          amount: 35.00,
          description: 'Groceries',
          categoryId: categoryMap.get('Groceries'),
        },
        {
          amount: 40.00,
          description: 'USB Cable',
          categoryId: categoryMap.get('Electronics'),
        },
        {
          amount: 10.50,
          description: 'Shampoo',
          categoryId: categoryMap.get('Personal Care'),
        },
      ];

      for (const item of splitItems) {
        await prisma.transaction.create({
          data: {
            date: new Date('2024-11-07'),
            amount: item.amount,
            type: 'EXPENSE',
            description: item.description,
            accountId: creditCardId,
            categoryId: item.categoryId || null,
            userId: user.id,
            parentId: splitParent.id,
          },
        });
      }

      console.log('Created split transaction: Walmart - Multiple Items');
    } else {
      console.log('Split transaction already exists');
    }
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
