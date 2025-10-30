import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash as hashPassword, verify as verifyPassword } from 'argon2';
import { randomBytes } from 'crypto';
import ms from 'ms';
import { RefreshToken, User, UserRole } from '../../entities';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: number;
    email: string;
    fullName?: string;
    role: UserRole;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
    });
    console.log('user register service', user);
    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.em.findOne(User, {
      email: dto.email.trim().toLowerCase(),
    });

    if (!user) {
      throw new UnauthorizedException('Wrong email or password used.');
    }

    const passwordValid = await verifyPassword(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Wrong email or password used.');
    }

    const tokens = await this.issueTokens(user);
    return { user: this.toSafeUser(user), tokens };
  }

  async refresh(token: string): Promise<AuthResult> {
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const activeTokens = await this.em.find(RefreshToken, {
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    let matched: RefreshToken | null = null;
    for (const candidate of activeTokens) {
      const isMatch = await verifyPassword(candidate.tokenHash, token);
      if (isMatch) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.em.populate(matched, ['user']);
    matched.revokedAt = new Date();
    await this.em.flush();

    const tokens = await this.issueTokens(matched.user);
    return { user: this.toSafeUser(matched.user), tokens };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    await this.revokeActiveTokens(user);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        expiresIn: this.accessTokenExpiry,
        secret: this.jwtSecret,
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenEntity = new RefreshToken();
    refreshTokenEntity.user = user;
    refreshTokenEntity.tokenHash = await hashPassword(refreshToken);
    refreshTokenEntity.expiresAt = new Date(
      Date.now() + this.refreshTokenTtlMs,
    );
    await this.em.persistAndFlush(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  private get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'changeme');
  }

  private get accessTokenExpiry(): ms.StringValue {
    return (this.configService.get<string>('JWT_ACCESS_TTL') ??
      '15m') as ms.StringValue;
  }

  private get refreshTokenTtlMs(): number {
    const refreshTtl = (this.configService.get<string>('JWT_REFRESH_TTL') ??
      '7d') as ms.StringValue;
    return ms(refreshTtl);
  }

  private async revokeActiveTokens(user: User): Promise<void> {
    await this.em.nativeUpdate(
      RefreshToken,
      { user: user.id, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async logout(userId: number): Promise<void> {
    const user = await this.em.findOne(User, userId);
    if (!user) {
      return;
    }
    await this.revokeActiveTokens(user);
  }

  getRefreshTokenTtlMs(): number {
    return this.refreshTokenTtlMs;
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
