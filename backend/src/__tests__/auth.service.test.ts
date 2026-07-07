/**
 * Unit tests for AuthService
 *
 * Tests cover:
 *  - login(): valid credentials, invalid credentials, inactive account, lastLoginAt update
 *  - createUser(): new user, duplicate username, password hashing
 *  - Property 8: Password Hashing (property-based test via fast-check)
 *
 * Mocking strategy:
 *   auth.service.ts initialises `userRepository = AppDataSource.getRepository(User)` at module
 *   load time (top-level).  We must therefore re-require the service in every test so the
 *   module-level code runs *after* our mocks are in place.
 *
 *   We use jest.resetModules() + jest.doMock() in beforeEach to achieve this.
 *
 *   Because resetModules also discards the cached error.middleware module (causing a different
 *   AppError class instance to be used by the service vs. the one imported statically at the
 *   top of this file), we avoid `instanceof AppError` checks and instead verify the error's
 *   `.statusCode` and `.code` properties — both approaches fulfil the same requirement.
 */

import * as fc from 'fast-check';
import { UserRole } from '../modules/auth/user.entity';

describe('AuthService', () => {
  let authService: any;
  let mockRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  // bcrypt and jwt mock function references kept per-test so tests can control return values
  let mockBcryptCompare: jest.Mock;
  let mockBcryptHash: jest.Mock;
  let mockJwtSign: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Fresh mock repo
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    // Fresh bcrypt mock fns
    mockBcryptCompare = jest.fn();
    mockBcryptHash = jest.fn();

    // Fresh jwt mock fn
    mockJwtSign = jest.fn().mockReturnValue('mock.jwt.token');

    // Register mocks BEFORE requiring the service
    jest.doMock('../config/database', () => ({
      __esModule: true,
      default: { getRepository: jest.fn().mockReturnValue(mockRepo) },
    }));

    // bcrypt is imported as: `import bcrypt from 'bcrypt'`
    // The default export must be an object with compare/hash methods.
    jest.doMock('bcrypt', () => {
      const mod: any = {
        compare: mockBcryptCompare,
        hash: mockBcryptHash,
      };
      mod.default = mod;
      return mod;
    });

    // jwt is imported as: `import jwt from 'jsonwebtoken'`
    jest.doMock('jsonwebtoken', () => {
      const mod: any = { sign: mockJwtSign };
      mod.default = mod;
      return mod;
    });

    // Re-require the service so module-level `userRepository = AppDataSource.getRepository(User)`
    // executes with our mocks already in the module registry.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AuthService } = require('../modules/auth/auth.service');
    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper: checks that an error looks like an AppError with the given statusCode + code,
  // without relying on instanceof (which breaks across resetModules boundaries).
  function expectAppError(err: any, statusCode: number, code: string) {
    expect(err).toBeDefined();
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(statusCode);
    expect(err.code).toBe(code);
    expect(err.message).toBeTruthy();
  }

  // =========================================================================
  // AuthService.login()
  // =========================================================================

  describe('login()', () => {
    const mockUser = {
      id: 'uuid-1',
      username: 'testuser',
      password: 'hashed_password',
      fullName: 'Test User',
      role: UserRole.TEACHER,
      isActive: true,
      lastLoginAt: null as Date | null,
    };

    it('returns token and user data on valid credentials', async () => {
      const user = { ...mockUser };
      mockRepo.findOne.mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);
      mockRepo.save.mockResolvedValue(user);

      const result = await authService.login('testuser', 'password123');

      expect(result).toEqual({
        token: 'mock.jwt.token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          fullName: mockUser.fullName,
          role: mockUser.role,
        },
      });
    });

    it('throws AppError 401 INVALID_CREDENTIALS when user is not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      let thrownError: any;
      try {
        await authService.login('unknown', 'any_password');
      } catch (err) {
        thrownError = err;
      }

      expectAppError(thrownError, 401, 'INVALID_CREDENTIALS');
    });

    it('throws AppError 401 INVALID_CREDENTIALS when password does not match', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser });
      mockBcryptCompare.mockResolvedValue(false);

      let thrownError: any;
      try {
        await authService.login('testuser', 'wrong_password');
      } catch (err) {
        thrownError = err;
      }

      expectAppError(thrownError, 401, 'INVALID_CREDENTIALS');
    });

    it('throws AppError 403 ACCOUNT_INACTIVE when user.isActive is false', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });
      mockBcryptCompare.mockResolvedValue(true);

      let thrownError: any;
      try {
        await authService.login('testuser', 'password123');
      } catch (err) {
        thrownError = err;
      }

      expectAppError(thrownError, 403, 'ACCOUNT_INACTIVE');
    });

    it('calls userRepository.save to update lastLoginAt on successful login', async () => {
      const user = { ...mockUser };
      mockRepo.findOne.mockResolvedValue(user);
      mockBcryptCompare.mockResolvedValue(true);
      mockRepo.save.mockResolvedValue(user);

      await authService.login('testuser', 'password123');

      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      const savedArg = mockRepo.save.mock.calls[0][0];
      expect(savedArg.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  // =========================================================================
  // AuthService.createUser()
  // =========================================================================

  describe('createUser()', () => {
    it('creates and returns a new user when username is unique', async () => {
      const newUser = {
        id: 'uuid-2',
        username: 'newuser',
        password: '$2b$10$hashed',
        fullName: 'New User',
        role: UserRole.TEACHER,
      };

      mockRepo.findOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('$2b$10$hashed');
      mockRepo.create.mockReturnValue(newUser);
      mockRepo.save.mockResolvedValue(newUser);

      const result = await authService.createUser('newuser', 'plain_password', 'New User');

      expect(result).toEqual({
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
      });
    });

    it('throws AppError 400 USERNAME_EXISTS when username already exists', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'existing-uuid', username: 'taken' });

      let thrownError: any;
      try {
        await authService.createUser('taken', 'password', 'Some Name');
      } catch (err) {
        thrownError = err;
      }

      expectAppError(thrownError, 400, 'USERNAME_EXISTS');
    });

    it('stores a hashed password — bcrypt.hash is called with the plain text, not stored raw', async () => {
      const newUser = {
        id: 'uuid-3',
        username: 'hashtest',
        password: '$2b$10$hashedvalue',
        fullName: 'Hash Test',
        role: UserRole.TEACHER,
      };

      mockRepo.findOne.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('$2b$10$hashedvalue');
      mockRepo.create.mockReturnValue(newUser);
      mockRepo.save.mockResolvedValue(newUser);

      await authService.createUser('hashtest', 'plain_password', 'Hash Test');

      // bcrypt.hash must have been called with the plain password and 10 rounds
      expect(mockBcryptHash).toHaveBeenCalledWith('plain_password', 10);

      // The repository must NOT have been asked to create a user with the plain password
      const createdArg = mockRepo.create.mock.calls[0][0];
      expect(createdArg.password).not.toBe('plain_password');
    });
  });

  // =========================================================================
  // Property-based test — Property 8: Password Hashing
  // Feature: student-management-system, Property 8: Password Hashing
  // =========================================================================

  describe('Property 8: Password Hashing', () => {
    it(
      'for any password, createUser always calls bcrypt.hash and never stores the raw password',
      async () => {
        // Feature: student-management-system, Property 8: Password Hashing
        await fc.assert(
          fc.asyncProperty(fc.string(), async (password) => {
            // Reset and rebuild mocks for each generated input
            jest.resetModules();

            const iterBcryptHash = jest.fn();
            const iterBcryptCompare = jest.fn();
            const iterJwtSign = jest.fn().mockReturnValue('tok');
            const hashedValue = `$2b$10$HASH::${password.length}::irreversible`;

            iterBcryptHash.mockResolvedValue(hashedValue);

            const iterMockRepo = {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn().mockImplementation((d: any) => Promise.resolve(d)),
              create: jest.fn().mockImplementation((d: any) => ({ ...d })),
            };

            jest.doMock('../config/database', () => ({
              __esModule: true,
              default: { getRepository: jest.fn().mockReturnValue(iterMockRepo) },
            }));

            jest.doMock('bcrypt', () => {
              const mod: any = { compare: iterBcryptCompare, hash: iterBcryptHash };
              mod.default = mod;
              return mod;
            });

            jest.doMock('jsonwebtoken', () => {
              const mod: any = { sign: iterJwtSign };
              mod.default = mod;
              return mod;
            });

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { AuthService: IterService } = require('../modules/auth/auth.service');
            const iterService = new IterService();

            await iterService.createUser(
              `user_${Math.random().toString(36).slice(2)}`,
              password,
              'Full Name'
            );

            // Property: bcrypt.hash must have been called at least once
            expect(iterBcryptHash).toHaveBeenCalled();

            // Property: the data given to create() must not contain the raw password
            if (iterMockRepo.create.mock.calls.length > 0) {
              const createdData = iterMockRepo.create.mock.calls[0][0];
              expect(createdData.password).not.toBe(password);
            }
          }),
          { numRuns: 100 }
        );
      }
    );
  });
});
