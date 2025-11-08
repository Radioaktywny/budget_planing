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
