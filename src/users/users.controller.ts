import { Controller } from '@nestjs/common';
import { RMQRoute, Validate } from 'nestjs-rmq';
import { MsgUserCreatedDto } from '../common/dto/msg-user-created.dto';
import { UserModel } from './user.model';
import { UsersService } from './users.service';
import { MsgUserDeletedDto } from '../common/dto/msg-user-deleted.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @RMQRoute('user.created')
    @Validate()
    async rmqCreateUser(data: MsgUserCreatedDto): Promise<UserModel> {
        return await this.usersService.createUser({
            _id: data.userId,
            email: data.email,
        });
    }

    @RMQRoute('user.deleted')
    @Validate()
    async rmqDeleteUser(data: MsgUserDeletedDto): Promise<UserModel> {
        return await this.usersService.deleteUser({
            _id: data.userId,
        });
    }
}
