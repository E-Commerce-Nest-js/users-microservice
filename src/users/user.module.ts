import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { ConfigModule } from '@nestjs/config';
import { UserModel } from './user.model';
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
    providers: [UserService, JwtAccessStrategy],
    controllers: [UserController],
})
export class UserModule {}
