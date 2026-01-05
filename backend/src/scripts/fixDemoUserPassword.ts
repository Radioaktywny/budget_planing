import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixDemoUserPassword() {
  try {
    console.log('Searching for demo user...');
    
    // First, list all users to find the demo user
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    
    console.log('\nFound users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name})`);
    });
    
    // Try to find demo user with different possible emails
    const possibleEmails = ['demo@demo.com', 'demo@example.com'];
    let demoUser = null;
    
    for (const email of possibleEmails) {
      demoUser = await prisma.user.findUnique({ where: { email } });
      if (demoUser) {
        console.log(`\nFound demo user with email: ${email}`);
        break;
      }
    }
    
    if (!demoUser) {
      console.log('\n❌ No demo user found with emails:', possibleEmails.join(', '));
      console.log('Please check the email address in your database.');
      return;
    }
    
    // Hash the password "demo123" with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    console.log('\nGenerated hash:', hashedPassword);
    
    // Update the demo user
    const result = await prisma.user.update({
      where: { id: demoUser.id },
      data: { password: hashedPassword },
    });
    
    console.log('\n✓ Demo user password updated successfully!');
    console.log('Email:', result.email);
    console.log('Password is now properly hashed');
    console.log('\nYou can now login with:');
    console.log(`  Email: ${result.email}`);
    console.log('  Password: demo123');
    
  } catch (error) {
    console.error('Error fixing demo user password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoUserPassword();
