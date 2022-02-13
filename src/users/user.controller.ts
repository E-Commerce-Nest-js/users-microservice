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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
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

    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get own data',
        description: 'This can only be done by the logged.',
    })
    @ApiResponse({ status: 401, description: 'Invalid Access-Token' })
    @ApiResponse({ status: 200, description: 'Return own data object', type: UserModel })
    @UseGuards(JwtAccessAuthGuard)
    @Get('iam')
    async getOwnData(@Req() req: RequestWithUser<AccessTokenPayloadDto>): Promise<UserModel> {
        const user = await this.userService.getUserById(req.user.id);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }

    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update own data',
        description: 'This can only be done by the logged.',
    })
    @ApiResponse({ status: 401, description: 'Invalid Access-Token' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 200, description: 'Return own data object', type: UserModel })
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

    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get array of users data',
        description: 'This can only be done by the logged in ADMIN or MANAGER.',
    })
    @ApiResponse({ status: 401, description: 'Invalid Access-Token' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden. Route for specific roles [admin, manager]',
    })
    @ApiResponse({
        status: 200,
        description: 'Return array of users data object',
        type: UserModel,
        isArray: true,
    })
    @UseGuards(RoleGuard([Role.Admin, Role.Manager]))
    @Get('')
    async getUsersList(): Promise<UserModel[]> {
        const users = await this.userService.getUsers();
        return users;
    }

    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get user data by ID',
        description: 'This can only be done by the logged in ADMIN or MANAGER.',
    })
    @ApiResponse({ status: 400, description: 'Validation error (incorrect user id)' })
    @ApiResponse({ status: 401, description: 'Invalid Access-Token' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden. Route for specific roles [admin, manager]',
    })
    @ApiResponse({ status: 404, description: 'Not Found' })
    @ApiResponse({ status: 200, description: 'Return user data object', type: UserModel })
    @UseGuards(RoleGuard([Role.Admin, Role.Manager]))
    @Get(':id')
    async getUserById(@Param('id', IdValidationPipe) id: string): Promise<UserModel> {
        const user = await this.userService.getUserById(id);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }

    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update user data by ID',
        description: 'This can only be done by the logged in ADMIN.',
    })
    @ApiResponse({ status: 400, description: 'Validation error (incorrect user id)' })
    @ApiResponse({ status: 401, description: 'Invalid Access-Token' })
    @ApiResponse({ status: 403, description: 'Forbidden. Route for specific roles [admin]' })
    @ApiResponse({ status: 404, description: 'Not Found' })
    @ApiResponse({ status: 200, description: 'Return updated user data object', type: UserModel })
    @UseGuards(RoleGuard([Role.Admin]))
    @Patch(':id')
    async updateUserById(
        @Param('id', IdValidationPipe) id: string,
        @Body() dto: UpdateUserDto,
    ): Promise<UserModel> {
        const user = await this.userService.updateUserById(id, dto);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }
}
