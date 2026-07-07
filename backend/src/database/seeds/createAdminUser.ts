import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../../config/database';
import { User, UserRole } from '../../modules/auth/user.entity';

dotenv.config();

/**
 * Seed script — creates the initial admin user.
 *
 * Usage:
 *   npx ts-node src/database/seeds/createAdminUser.ts
 *   OR via npm script:
 *   npm run seed:admin
 *
 * Environment variables used:
 *   ADMIN_USERNAME   (default: admin)
 *   ADMIN_PASSWORD   (default: Admin@1234)
 *   ADMIN_FULL_NAME  (default: مدير النظام)
 *   BCRYPT_SALT_ROUNDS (default: 10)
 */
async function createAdminUser(): Promise<void> {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const plainPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const fullName = process.env.ADMIN_FULL_NAME || 'مدير النظام';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

  console.log('⏳  Connecting to database…');
  await AppDataSource.initialize();
  console.log('✓   Database connected');

  const userRepo = AppDataSource.getRepository(User);

  // Check if an admin already exists — avoid duplicate seed runs
  const existing = await userRepo.findOne({ where: { username } });
  if (existing) {
    console.log(`ℹ️   Admin user "${username}" already exists — skipping creation.`);
    await AppDataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const admin = userRepo.create({
    username,
    password: hashedPassword,
    fullName,
    role: UserRole.ADMIN,
    isActive: true,
  });

  await userRepo.save(admin);

  console.log('✅  Admin user created successfully');
  console.log(`    Username : ${username}`);
  console.log(`    Full Name: ${fullName}`);
  console.log(`    Role     : ${UserRole.ADMIN}`);
  console.log('    Password : (set via ADMIN_PASSWORD env var — default: Admin@1234)');
  console.log('');
  console.log('⚠️   Change the default password immediately after first login!');

  await AppDataSource.destroy();
}

createAdminUser().catch((err) => {
  console.error('✗  Failed to create admin user:', err);
  process.exit(1);
});
