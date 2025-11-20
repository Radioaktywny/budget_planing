/**
 * Script to add password to existing default user
 * This allows the default user with existing data to login with authentication
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_USER_EMAIL = 'user@budgetmanager.local';
const DEFAULT_PASSWORD = 'password123'; // Change this to your preferred password
const SALT_ROUNDS = 10;

async function addPasswordToDefaultUser() {
  try {
    console.log('Looking for default user...');
    
    // Find the default user
    const user = await prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
    });

    if (!user) {
      console.error(`❌ User ${DEFAULT_USER_EMAIL} not found!`);
      console.log('Please run: npm run prisma:seed');
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.name} (${user.email})`);

    // Check if user already has a password
    if (user.password) {
      console.log('⚠️  User already has a password set.');
      console.log('Updating to new password...');
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Update user with password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true, // Mark email as verified for convenience
      },
    });

    console.log('✅ Password added successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${DEFAULT_USER_EMAIL}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log('\n🔐 You can now login at http://localhost:3000');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error adding password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPasswordToDefaultUser();
