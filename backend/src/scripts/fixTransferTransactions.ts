import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to analyze transactions with "Transfer" category
 * These transactions are automatically excluded from income/expense reports
 */
async function analyzeTransferTransactions() {
  try {
    console.log('Analyzing transfer transactions...\n');

    // Find all categories with "transfer" in the name (case-insensitive)
    const allCategories = await prisma.category.findMany();
    
    const transferCategories = allCategories.filter(
      cat => cat.name.toLowerCase().includes('transfer')
    );

    if (transferCategories.length === 0) {
      console.log('No "Transfer" categories found.');
      return;
    }

    console.log(`Found ${transferCategories.length} transfer-related categories:`);
    transferCategories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`);
    });
    console.log('');

    // Find all transactions with transfer categories
    const transferTransactions = await prisma.transaction.findMany({
      where: {
        categoryId: {
          in: transferCategories.map(c => c.id),
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`Found ${transferTransactions.length} transactions with transfer categories\n`);

    if (transferTransactions.length === 0) {
      console.log('No transactions to analyze.');
      return;
    }

    // Group by type
    const byType = {
      INCOME: transferTransactions.filter(t => t.type === 'INCOME'),
      EXPENSE: transferTransactions.filter(t => t.type === 'EXPENSE'),
      TRANSFER: transferTransactions.filter(t => t.type === 'TRANSFER'),
    };

    console.log('Breakdown by type:');
    console.log(`  Income:   ${byType.INCOME.length} transactions`);
    console.log(`  Expense:  ${byType.EXPENSE.length} transactions`);
    console.log(`  Transfer: ${byType.TRANSFER.length} transactions`);
    console.log('');

    // Calculate totals
    const totalIncome = byType.INCOME.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = byType.EXPENSE.reduce((sum, t) => sum + Number(t.amount), 0);

    console.log('Total amounts:');
    console.log(`  Income:  ${totalIncome.toFixed(2)}`);
    console.log(`  Expense: ${totalExpense.toFixed(2)}`);
    console.log('');

    console.log('✅ All transactions with "Transfer" category are automatically excluded from reports.');
    console.log('   No action needed - the report service filters them out.');
  } catch (error) {
    console.error('Error analyzing transfer transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
analyzeTransferTransactions()
  .then(() => {
    console.log('\n✅ Analysis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
