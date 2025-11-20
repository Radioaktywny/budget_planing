/**
 * Test script to verify starter data creation
 * Creates a test user and checks if categories and tags are created
 */

import { PrismaClient } from '@prisma/client';
import { registerUser } from '../services/authService';

const prisma = new PrismaClient();

async function testStarterData() {
  try {
    console.log('Testing starter data creation...\n');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`Creating test user: ${testEmail}`);
    const result = await registerUser(testEmail, testPassword, 'Test User');
    
    console.log(`✓ User created: ${result.user.name} (${result.user.email})`);
    console.log(`  User ID: ${result.user.id}\n`);
    
    // Wait a moment for async starter data creation
    console.log('Waiting for starter data creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check categories
    const categories = await prisma.category.findMany({
      where: { userId: result.user.id },
      orderBy: { name: 'asc' },
    });
    
    console.log(`\n✓ Categories created: ${categories.length}`);
    console.log('Sample categories:');
    categories.slice(0, 10).forEach(cat => {
      console.log(`  - ${cat.name} (${cat.color})`);
    });
    
    // Check tags
    const tags = await prisma.tag.findMany({
      where: { userId: result.user.id },
      orderBy: { name: 'asc' },
    });
    
    console.log(`\n✓ Tags created: ${tags.length}`);
    console.log('Tags:');
    tags.forEach(tag => {
      console.log(`  - ${tag.name}`);
    });
    
    console.log('\n✅ Starter data test completed successfully!');
    console.log(`\nTest user credentials:`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    console.log(`\nYou can login with these credentials to verify in the UI.`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testStarterData();
