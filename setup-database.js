// Database setup script
// Run with: node setup-database.js

const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Setting up database...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test the connection by trying to execute a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful:', result);
    
    // Try to create a test user to verify tables exist
    try {
      const testUser = await prisma.user.upsert({
        where: { id: 'test-setup-user' },
        update: {},
        create: {
          id: 'test-setup-user',
          email: 'test-setup@example.com'
        }
      });
      console.log('✅ User table is working:', testUser);
      
      // Clean up test user
      await prisma.user.delete({
        where: { id: 'test-setup-user' }
      });
      console.log('✅ Test user cleaned up');
      
    } catch (tableError) {
      console.log('❌ Tables might not exist yet. Error:', tableError.message);
      console.log('📋 Please run the SQL from database-setup.sql in your Supabase dashboard');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Verify your Supabase database is running');
    console.log('3. Run the database-setup.sql file in Supabase SQL Editor');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
