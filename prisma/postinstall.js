const { execSync } = require('child_process');

// This is a Prisma postinstall script that ensures Prisma Client is generated
// It's safer than relying on the build step since it will work in all environments
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating Prisma Client:', error);
  process.exit(1);
}
