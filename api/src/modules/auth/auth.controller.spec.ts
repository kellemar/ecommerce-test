import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getRefreshTokenTtlMs: jest.fn().mockReturnValue(604800000), // 7 days
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and set refresh cookie', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResult = {
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
        user: { id: 1, email: registerDto.email, name: registerDto.name },
      };

      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await controller.register(registerDto, mockResponse);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 604800000,
          path: '/auth',
        }),
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        user: mockResult.user,
      });
    });
  });

  describe('login', () => {
    it('should login user and set refresh cookie', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
        user: { id: 1, email: loginDto.email },
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        user: mockResult.user,
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens using cookie', async () => {
      const mockReq = {
        cookies: { refresh_token: 'old-refresh-token' },
      } as any;

      const mockResult = {
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
        user: { id: 1, email: 'test@example.com' },
      };

      mockAuthService.refresh.mockResolvedValue(mockResult);

      const result = await controller.refresh(mockReq, {}, mockResponse);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'new-access-token',
        user: mockResult.user,
      });
    });

    it('should refresh tokens using body token', async () => {
      const mockReq = { cookies: {} } as any;
      const refreshDto: RefreshTokenDto = { refreshToken: 'body-token' };

      mockAuthService.refresh.mockResolvedValue({
        tokens: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
        user: { id: 1, email: 'test@example.com' },
      });

      await controller.refresh(mockReq, refreshDto, mockResponse);

      expect(authService.refresh).toHaveBeenCalledWith('body-token');
    });

    it('should throw error when no refresh token provided', async () => {
      const mockReq = { cookies: {} } as any;

      await expect(
        controller.refresh(mockReq, {}, mockResponse),
      ).rejects.toThrow('Refresh token missing');
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh cookie', async () => {
      const userId = 1;

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(userId, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/auth',
        }),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
