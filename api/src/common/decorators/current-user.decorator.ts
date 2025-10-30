import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (property: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!property) {
      return user;
    }
    return user?.[property];
  },
);
