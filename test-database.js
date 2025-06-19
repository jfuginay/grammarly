// Test database connection and tables
// Run with: node test-database.js

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('🔄 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    
    // Test User table
    console.log('\n🔄 Testing User table...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists. Current user count: ${userCount}`);
    
    // Test Document table
    console.log('\n🔄 Testing Document table...');
    const documentCount = await prisma.document.count();
    console.log(`✅ Document table exists. Current document count: ${documentCount}`);
    
    // Test creating a user (this tests the full workflow)
    console.log('\n🔄 Testing user creation workflow...');
    const testUser = await prisma.user.upsert({
      where: { id: 'test-connection-user' },
      update: { email: 'test-updated@example.com' },
      create: {
        id: 'test-connection-user',
        email: 'test-connection@example.com'
      }
    });
    console.log('✅ User upsert successful:', testUser);
    
    // Test creating a document
    console.log('\n🔄 Testing document creation workflow...');
    const testDocument = await prisma.document.upsert({
      where: { id: 'test-connection-doc' },
      update: { title: 'Updated Test Document' },
      create: {
        id: 'test-connection-doc',
        title: 'Test Document',
        content: 'This is a test document to verify database functionality.',
        authorId: 'test-connection-user'
      }
    });
    console.log('✅ Document upsert successful:', testDocument);
    
    // Test relationship query
    console.log('\n🔄 Testing relationship queries...');
    const userWithDocuments = await prisma.user.findUnique({
      where: { id: 'test-connection-user' },
      include: {
        documents: true
      }
    });
    console.log('✅ User with documents query successful:', userWithDocuments);
    
    // Clean up test data
    console.log('\n🔄 Cleaning up test data...');
    await prisma.document.delete({
      where: { id: 'test-connection-doc' }
    });
    await prisma.user.delete({
      where: { id: 'test-connection-user' }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed! Your database is ready for use.');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    
    if (error.code === 'P2002') {
      console.log('💡 This might be a unique constraint error - data already exists');
    } else if (error.code === 'P2025') {
      console.log('💡 Record not found - this might be expected during cleanup');
    } else if (error.message.includes("doesn't exist")) {
      console.log('💡 Table might not exist. Please run the database setup SQL first.');
    } else {
      console.log('💡 Check your DATABASE_URL and make sure Supabase is accessible');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDatabase()
    .then(() => {
      console.log('\n✅ Database testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabase };
