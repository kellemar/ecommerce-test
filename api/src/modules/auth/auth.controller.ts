import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { CookieOptions } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const token = cookies?.['refresh_token'] ?? dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const { tokens, user } = await this.authService.refresh(token);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser('sub') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const options = this.getCookieOptions();
    res.cookie('refresh_token', refreshToken, options);
  }

  private clearRefreshCookie(res: Response) {
    const options = this.getCookieOptions();
    res.clearCookie('refresh_token', options);
  }

  private get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  private getCookieOptions(): CookieOptions {
    const secureOverride = process.env.REFRESH_COOKIE_SECURE;
    const secure = secureOverride
      ? secureOverride.toLowerCase() === 'true'
      : this.isProduction;
    const sameSiteOverride = process.env.REFRESH_COOKIE_SAMESITE?.toLowerCase();
    const sameSite = (sameSiteOverride === 'none' || sameSiteOverride === 'lax' || sameSiteOverride === 'strict')
      ? sameSiteOverride
      : secure
        ? 'none'
        : 'lax';
    const domain = process.env.REFRESH_COOKIE_DOMAIN;
    return {
      httpOnly: true,
      secure,
      sameSite: sameSite as CookieOptions['sameSite'],
      maxAge: this.authService.getRefreshTokenTtlMs(),
      path: '/',
      domain: domain || undefined,
    };
  }
}
