import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
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
        return user;
    }

    @UseGuards(JwtAccessAuthGuard)
    @Patch('iam')
    async updateOwnData(
        @Req() req: RequestWithUser<AccessTokenPayloadDto>,
        @Body() dto: UpdateUserDto,
    ): Promise<UserModel> {
        const user = await this.userService.updateUserById(req.user.id, dto);
        return user;
    }
}
