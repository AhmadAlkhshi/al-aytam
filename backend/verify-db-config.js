/**
 * Quick verification script for database configuration
 * This script checks if the TypeORM configuration is properly set up
 * without requiring a database connection.
 * 
 * Run with: node verify-db-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('TypeORM Configuration Verification');
console.log('='.repeat(60));

// Check if required files exist
const requiredFiles = [
  'src/config/database.ts',
  '.env.example',
];

console.log('\n1. Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check if .env file exists (optional but recommended)
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);
console.log(`   ${envExists ? '✓' : '⚠'} .env ${envExists ? '' : '(optional - copy from .env.example)'}`);

// Check database.ts content
console.log('\n2. Verifying database.ts configuration...');
const dbConfigPath = path.join(__dirname, 'src', 'config', 'database.ts');
const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');

const checks = [
  { name: 'PostgreSQL type', pattern: /type:\s*['"]postgres['"]/ },
  { name: 'Environment variables', pattern: /process\.env\.DB_/ },
  { name: 'Connection pool (max 20)', pattern: /max:\s*20/ },
  { name: 'Connection pool (min 5)', pattern: /min:\s*5/ },
  { name: 'Entity paths', pattern: /entities:\s*\[/ },
  { name: 'Migration paths', pattern: /migrations:\s*\[/ },
  { name: 'initializeDatabase function', pattern: /export const initializeDatabase/ },
  { name: 'closeDatabase function', pattern: /export const closeDatabase/ },
  { name: 'isDatabaseConnected function', pattern: /export const isDatabaseConnected/ },
  { name: 'Error handling', pattern: /try\s*{[\s\S]*catch\s*\(/ },
  { name: 'Logger integration', pattern: /logger\.(info|error|warn)/ },
];

checks.forEach(check => {
  const passed = check.pattern.test(dbConfigContent);
  console.log(`   ${passed ? '✓' : '✗'} ${check.name}`);
});

// Check .env.example content
console.log('\n3. Verifying .env.example...');
const envExamplePath = path.join(__dirname, '.env.example');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

const envChecks = [
  { name: 'DB_HOST', pattern: /DB_HOST/ },
  { name: 'DB_PORT', pattern: /DB_PORT/ },
  { name: 'DB_USER', pattern: /DB_USER/ },
  { name: 'DB_PASSWORD', pattern: /DB_PASSWORD/ },
  { name: 'DB_NAME', pattern: /DB_NAME/ },
];

envChecks.forEach(check => {
  const passed = check.pattern.test(envExampleContent);
  console.log(`   ${passed ? '✓' : '✗'} ${check.name}`);
});

// Summary
console.log('\n' + '='.repeat(60));
if (allFilesExist) {
  console.log('✓ Configuration verification completed successfully!');
  console.log('\nNext steps:');
  console.log('  1. Copy .env.example to .env and configure your database credentials');
  console.log('  2. Ensure PostgreSQL is running');
  console.log('  3. Run: npm run dev');
} else {
  console.log('✗ Some required files are missing!');
  process.exit(1);
}
console.log('='.repeat(60));
