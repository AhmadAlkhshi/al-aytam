import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppDataSource from '../../config/database';
import { User, UserRole } from './user.entity';
import { AppError } from '../../shared/middleware/error.middleware';

export class AuthService {
  private get userRepository() {
    return AppDataSource.getRepository(User);
  }

  async login(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    
    if (!user) {
      throw new AppError('اسم المستخدم أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('اسم المستخدم أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('الحساب غير نشط', 403, 'ACCOUNT_INACTIVE');
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    };
  }

  async createUser(username: string, password: string, fullName: string, role: UserRole = UserRole.TEACHER) {
    const existingUser = await this.userRepository.findOne({ where: { username } });
    
    if (existingUser) {
      throw new AppError('اسم المستخدم موجود مسبقاً', 400, 'USERNAME_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      fullName,
      role
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    };
  }
}
