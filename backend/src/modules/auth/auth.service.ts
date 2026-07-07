import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppDataSource from '../../config/database';
import { User, UserRole } from './user.entity';
import { AppError } from '../../shared/middleware/error.middleware';

const userRepository = AppDataSource.getRepository(User);

export class AuthService {
  async login(username: string, password: string) {
    const user = await userRepository.findOne({ where: { username } });
    
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
    await userRepository.save(user);

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
    const existingUser = await userRepository.findOne({ where: { username } });
    
    if (existingUser) {
      throw new AppError('اسم المستخدم موجود مسبقاً', 400, 'USERNAME_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = userRepository.create({
      username,
      password: hashedPassword,
      fullName,
      role
    });

    await userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    };
  }
}
