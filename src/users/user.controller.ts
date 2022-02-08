import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { RMQRoute, Validate } from 'nestjs-rmq';
import { MsgUserUpdatedDto } from '../common/dto/msg-user-update.dto';
import { MsgUserCreatedDto } from '../common/dto/msg-user-created.dto';
import { UserModel } from './user.model';
import { UserService } from './user.service';
import { MsgUserDeletedDto } from '../common/dto/msg-user-deleted.dto';
import { RequestWithUser } from '../common/types/request-with-user.type';
import { AccessTokenPayloadDto } from '../common/dto/at-payload.dto';
import { JwtAccessAuthGuard } from '../common/guards/jwt-access.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { RoleGuard } from '../common/guards/role.guard';
import { Role } from '../common/types/role.type';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @RMQRoute('user.created')
    @Validate()
    async rmqCreateUser(data: MsgUserCreatedDto): Promise<UserModel> {
        return await this.userService.createUser({
            _id: data.userId,
            email: data.email,
        });
    }

    @RMQRoute('user.updated')
    @Validate()
    async rmqUpdateUser(data: MsgUserUpdatedDto): Promise<UserModel> {
        return await this.userService.updateUserEmailById(data.userId, data.email);
    }

    @RMQRoute('user.deleted')
    @Validate()
    async rmqDeleteUser(data: MsgUserDeletedDto): Promise<UserModel> {
        return await this.userService.deleteUser({
            _id: data.userId,
        });
    }

    @UseGuards(JwtAccessAuthGuard)
    @Get('iam')
    async getOwnData(@Req() req: RequestWithUser<AccessTokenPayloadDto>): Promise<UserModel> {
        const user = await this.userService.getUserById(req.user.id);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }

    @UseGuards(JwtAccessAuthGuard)
    @Patch('iam')
    async updateOwnData(
        @Req() req: RequestWithUser<AccessTokenPayloadDto>,
        @Body() dto: UpdateUserDto,
    ): Promise<UserModel> {
        const user = await this.userService.updateUserById(req.user.id, dto);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }

    @UseGuards(RoleGuard([Role.Admin, Role.Manager]))
    @Get('')
    async getUsersList(): Promise<UserModel[]> {
        const users = await this.userService.getUsers();
        return users;
    }

    @UseGuards(RoleGuard([Role.Admin, Role.Manager]))
    @Get(':id')
    async getUserById(@Param('id', IdValidationPipe) id: string): Promise<UserModel> {
        const user = await this.userService.getUserById(id);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }
}
