import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { Role } from '../types/role.type';
import { AccessTokenPayloadDto } from '../dto/at-payload.dto';
import { JwtAccessAuthGuard } from './jwt-access.guard';

export const RoleGuard = (roles: Role[]): Type<CanActivate> => {
    class RoleGuardMixin extends JwtAccessAuthGuard {
        async canActivate(context: ExecutionContext): Promise<boolean> {
            await super.canActivate(context);

            const request = context
                .switchToHttp()
                .getRequest<Request & { user: AccessTokenPayloadDto }>();
            const user = request.user;

            return roles.includes(user.role as Role);
        }
    }

    return mixin(RoleGuardMixin);
};
