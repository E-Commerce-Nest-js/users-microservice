import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { ConfigModule } from '@nestjs/config';
import { UserModel } from './user.model';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from '../common/strategies/jwt-access.strategy';

@Module({
    imports: [
        TypegooseModule.forFeature([
            {
                typegooseClass: UserModel,
                schemaOptions: {
                    collection: 'User',
                },
            },
        ]),
        ConfigModule,
    ],
    providers: [UsersService, JwtAccessStrategy],
    controllers: [UsersController],
})
export class UsersModule {}
