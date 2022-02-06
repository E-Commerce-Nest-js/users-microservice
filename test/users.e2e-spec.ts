import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Connection, disconnect } from 'mongoose';
import { getConnectionToken, TypegooseModule } from 'nestjs-typegoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestUserType } from './types/test-user.type';
import { RMQModule, RMQService, RMQTestService } from 'nestjs-rmq';
import { UserModel } from '../src/users/user.model';
import { MsgUserCreatedDto } from '../src/common/dto/msg-user-created.dto';
import { UsersModule } from '../src/users/users.module';
import { getMongoConfig } from '../src/configs/mongo.config';
import { MsgUserDeletedDto } from '../src/common/dto/msg-user-deleted.dto';

describe('UsersController (e2e)', () => {
    let app: INestApplication;
    let connection: Connection;
    let configService: ConfigService;
    let rmqService: RMQTestService;

    let adminData: TestUserType;
    let userData: TestUserType;

    beforeAll(async () => {
        const testAppModule: TestingModule = await Test.createTestingModule({
            imports: [
                UsersModule,
                ConfigModule.forRoot(),
                TypegooseModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: getMongoConfig,
                }),
                RMQModule.forTest({}),
            ],
        }).compile();

        app = testAppModule.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        connection = await testAppModule.get(getConnectionToken());
        await connection.dropDatabase();

        rmqService = await testAppModule.get(RMQService);

        configService = await testAppModule.get(ConfigService);

        adminData = {
            id: configService.get('TEST_ADMIN_ID'),
            email: configService.get('TEST_ADMIN_EMAIL'),
            accessToken: configService.get('TEST_ADMIN_ACCESS_TOKEN'),
        };

        userData = {
            id: configService.get('TEST_USER_ID'),
            email: configService.get('TEST_USER_EMAIL'),
            accessToken: configService.get('TEST_USER_ACCESS_TOKEN'),
        };
    });

    afterAll(() => {
        disconnect();
        rmqService.disconnect();
    });

    describe('[FIRST TEST] "user.created" (RMQ)', () => {
        test('(SUCCESS) [admin] should return user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                'user.created',
                {
                    email: adminData.email,
                    userId: adminData.id,
                },
            );
            expect(user._id.toString()).toBe(adminData.id);
            expect(user.email).toBe(adminData.email);
        });

        test('(SUCCESS) [user] should return user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                'user.created',
                {
                    email: userData.email,
                    userId: userData.id,
                },
            );
            expect(user._id.toString()).toBe(userData.id);
            expect(user.email).toBe(userData.email);
        });

        test('(VALIDATION) should return error message "userId must be a mongodb id; userId must be a string; userId should not be empty"', async () => {
            try {
                const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                    'user.created',
                    {
                        email: adminData.email,
                        userId: undefined,
                    },
                );
            } catch (e) {
                expect(e.message).toBe(
                    'userId must be a mongodb id; userId must be a string; userId should not be empty',
                );
                expect(e.type).toBe('RMQ');
            }
        });

        test('(VALIDATION) should return error message "email must be a string; email must be an email; email should not be empty"', async () => {
            try {
                const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                    'user.created',
                    {
                        email: undefined,
                        userId: adminData.id,
                    },
                );
            } catch (e) {
                expect(e.message).toBe(
                    'email must be a string; email must be an email; email should not be empty',
                );
                expect(e.type).toBe('RMQ');
            }
        });
    });

    describe('[LAST TEST] "user.deleted" (RMQ)', () => {
        test('(SUCCESS) [admin] should return deleted user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserDeletedDto, UserModel>(
                'user.deleted',
                {
                    userId: adminData.id,
                },
            );
            expect(user._id.toString()).toBe(adminData.id);
        });

        test('(VALIDATION) should return error message "userId must be a mongodb id; userId must be a string; userId should not be empty"', async () => {
            try {
                const user = await rmqService.triggerRoute<MsgUserDeletedDto, UserModel>(
                    'user.deleted',
                    {
                        userId: undefined,
                    },
                );
            } catch (e) {
                expect(e.message).toBe(
                    'userId must be a mongodb id; userId must be a string; userId should not be empty',
                );
                expect(e.type).toBe('RMQ');
            }
        });
    });
});
