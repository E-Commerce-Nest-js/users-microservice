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
import { UserModule } from '../src/users/user.module';
import { getMongoConfig } from '../src/configs/mongo.config';
import { MsgUserDeletedDto } from '../src/common/dto/msg-user-deleted.dto';
import { MsgUserUpdatedDto } from 'src/common/dto/msg-user-update.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

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
                UserModule,
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
            dto: {
                _id: configService.get('TEST_ADMIN_ID'),
                email: configService.get('TEST_ADMIN_EMAIL'),
            },
            accessToken: configService.get('TEST_ADMIN_ACCESS_TOKEN'),
        };

        userData = {
            dto: {
                _id: configService.get('TEST_USER_ID'),
                email: configService.get('TEST_USER_EMAIL'),
            },
            accessToken: configService.get('TEST_USER_ACCESS_TOKEN'),
        };
    });

    afterAll(() => {
        disconnect();
        rmqService.disconnect();
    });

    describe('[ TEST MUST BE FIRST ] "user.created" (RMQ)', () => {
        test('(SUCCESS) [admin] should return user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                'user.created',
                {
                    email: adminData.dto.email,
                    userId: adminData.dto._id,
                },
            );
            expect(user._id.toString()).toBe(adminData.dto._id);
            expect(user.email).toBe(adminData.dto.email);
        });

        test('(SUCCESS) [user] should return user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                'user.created',
                {
                    email: userData.dto.email,
                    userId: userData.dto._id,
                },
            );
            expect(user._id.toString()).toBe(userData.dto._id);
            expect(user.email).toBe(userData.dto.email);
        });

        test('(VALIDATION) should return error message "userId must be a mongodb id; userId must be a string; userId should not be empty"', async () => {
            try {
                const user = await rmqService.triggerRoute<MsgUserCreatedDto, UserModel>(
                    'user.created',
                    {
                        email: adminData.dto.email,
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
                        userId: adminData.dto._id,
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

    describe('"user.updated" (RMQ)', () => {
        test('(SUCCESS) [user] should return user data object', async () => {
            userData.dto.email = 'newemail' + userData.dto.email;

            const user = await rmqService.triggerRoute<MsgUserUpdatedDto, UserModel>(
                'user.updated',
                {
                    email: userData.dto.email,
                    userId: userData.dto._id,
                },
            );

            expect(user._id.toString()).toBe(userData.dto._id);
            expect(user.email).toBe(userData.dto.email);
        });

        test('(VALIDATION) should return error message "userId must be a mongodb id; userId must be a string; userId should not be empty"', async () => {
            try {
                const user = await rmqService.triggerRoute<MsgUserUpdatedDto, UserModel>(
                    'user.updated',
                    {
                        email: userData.dto.email,
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
                const user = await rmqService.triggerRoute<MsgUserUpdatedDto, UserModel>(
                    'user.updated',
                    {
                        email: undefined,
                        userId: userData.dto._id,
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

    describe('/users/iam (GET)', () => {
        test('(SUCCESS) [by User] should return 200 and user data object', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                }),
            );
        });

        test('(ERROR) should return 401 if send invalid access JWT', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/iam')
                .set('Authorization', `Bearer INVALID.access.Token`);

            expect(response.statusCode).toBe(401);
        });
    });

    describe('/users/iam (PATCH)', () => {
        test('(SUCCESS) [full update] should return 200 and updated user data object', async () => {
            const user: UpdateUserDto = {
                first_name: 'Bob',
                second_name: 'Smith',
                birthday: '2020-12-12',
                avatar_url: 'https://image.com/img1.jpg',
                address: {
                    apartment: '123',
                    city: 'Bali',
                    street: 'Pushkina',
                    index: '54003344',
                },
            };

            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send(user);

            userData.dto.first_name = response.body.first_name;
            userData.dto.second_name = response.body.second_name;
            userData.dto.birthday = response.body.birthday;
            userData.dto.avatar_url = response.body.avatar_url;
            userData.dto.address = response.body.address;

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                    first_name: expect.stringContaining(user.first_name),
                    second_name: expect.stringContaining(user.second_name),
                    birthday: expect.stringContaining(user.birthday),
                    avatar_url: expect.stringContaining(user.avatar_url),
                    address: expect.objectContaining({
                        apartment: expect.any(String),
                        city: expect.any(String),
                        street: expect.any(String),
                        index: expect.any(String),
                    }),
                }),
            );
        });

        test('(SUCCESS) [one filed update] should return 200 and updated user data object', async () => {
            const user: UpdateUserDto = {
                first_name: 'Bobik',
            };

            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send(user);

            userData.dto.first_name = response.body.first_name;

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                    first_name: expect.stringContaining(user.first_name),
                }),
            );
        });

        test('(ERROR) should return 401 if send invalid access JWT', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer INVALID.access.Token`);

            expect(response.statusCode).toBe(401);
        });

        test('(VAILDATION) should return 400 with message ["first_name must be a string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({ first_name: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual(['first_name must be a string']);
        });

        test('(VAILDATION) should return 400 with message ["second_name must be a string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({ second_name: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual(['second_name must be a string']);
        });

        test('(VAILDATION) should return 400 with message ["birthday must be a string", birthday must be a valid YYYY-MM-DD date string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({ birthday: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'birthday must be a string',
                'birthday must be a valid YYYY-MM-DD date string',
            ]);
        });

        test('(VAILDATION) should return 400 with message ["avatar_url must be a string", "avatar_url must be an URL address"]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({ avatar_url: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'avatar_url must be a string',
                'avatar_url must be an URL address',
            ]);
        });

        test('(VAILDATION) should return 400 with message ["address.nested property address must be object with fields: {index, city, street, apartment}"]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({ address: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'address.nested property address must be object with fields: {index, city, street, apartment}',
            ]);
        });

        test('(VAILDATION) should return 400 with message [{index, city, street, apartment} must be a string and should not be empty]', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/iam')
                .set('Authorization', `Bearer ${userData.accessToken}`)
                .send({
                    address: {},
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'address.index must be a string',
                'address.index should not be empty',
                'address.city must be a string',
                'address.city should not be empty',
                'address.street must be a string',
                'address.street should not be empty',
                'address.apartment must be a string',
                'address.apartment should not be empty',
            ]);
        });
    });

    describe('/users/:id (GET)', () => {
        test('(SUCCESS) [by Admin] should return 200 and user data object', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                }),
            );
        });

        test('(ERROR) should return 401 if send invalid access JWT', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer INVALID.access.Token`);

            expect(response.statusCode).toBe(401);
        });

        test('(ERROR) [by User] should return 403 if send user access JWT', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${userData.accessToken}`);

            expect(response.statusCode).toBe(403);
        });

        test('(ERROR) should return 404 if send spoof user id', async () => {
            const invalidUserId = userData.dto._id.replace(/[abcdef]/g, 'a');
            const response = await request(app.getHttpServer())
                .get(`/users/${invalidUserId}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`);

            expect(response.statusCode).toBe(404);
        });

        test('(VALIDATION) should return 400 with message [invalid user id]', async () => {
            const invalidUserId = userData.dto._id.replace(/[abcdef]/g, 'p');
            const response = await request(app.getHttpServer())
                .get(`/users/${invalidUserId}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('/users/:id (PATCH)', () => {
        test('(SUCCESS) [by Admin] should return 200 and updated user data object [full update]', async () => {
            const user: UpdateUserDto = {
                first_name: 'Bob1',
                second_name: 'Smith1',
                birthday: '2020-12-23',
                avatar_url: 'https://image.com/img12.jpg',
                address: {
                    apartment: '1231',
                    city: 'Bali1',
                    street: 'Pushkina1',
                    index: '540033441',
                },
            };

            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send(user);

            userData.dto.first_name = response.body.first_name;
            userData.dto.second_name = response.body.second_name;
            userData.dto.birthday = response.body.birthday;
            userData.dto.avatar_url = response.body.avatar_url;
            userData.dto.address = response.body.address;

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                    first_name: expect.stringContaining(user.first_name),
                    second_name: expect.stringContaining(user.second_name),
                    birthday: expect.stringContaining(user.birthday),
                    avatar_url: expect.stringContaining(user.avatar_url),
                    address: expect.objectContaining({
                        apartment: expect.any(String),
                        city: expect.any(String),
                        street: expect.any(String),
                        index: expect.any(String),
                    }),
                }),
            );
        });

        test('(SUCCESS) [by Admin] should return 200 and updated user data object [one filed update]', async () => {
            const user: UpdateUserDto = {
                first_name: 'Bobik123',
            };

            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send(user);

            userData.dto.first_name = response.body.first_name;

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: expect.stringContaining(userData.dto._id),
                    email: expect.stringContaining(userData.dto.email),
                    first_name: expect.stringContaining(user.first_name),
                }),
            );
        });

        test('(ERROR) should return 401 if send invalid access JWT', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer invalid.access.token`);

            expect(response.statusCode).toBe(401);
        });

        test('(ERROR) [by User] should return 403 if send user access JWT', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${userData.accessToken}`);

            expect(response.statusCode).toBe(403);
        });

        test('(VAILDATION) [by Admin] should return 400 with message ["first_name must be a string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({ first_name: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual(['first_name must be a string']);
        });

        test('(VAILDATION) [by Admin] should return 400 with message ["second_name must be a string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({ second_name: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual(['second_name must be a string']);
        });

        test('(VAILDATION) [by Admin] should return 400 with message ["birthday must be a string", birthday must be a valid YYYY-MM-DD date string"]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({ birthday: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'birthday must be a string',
                'birthday must be a valid YYYY-MM-DD date string',
            ]);
        });

        test('(VAILDATION) [by Admin] should return 400 with message ["avatar_url must be a string", "avatar_url must be an URL address"]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({ avatar_url: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'avatar_url must be a string',
                'avatar_url must be an URL address',
            ]);
        });

        test('(VAILDATION) [by Admin] should return 400 with message ["address.nested property address must be object with fields: {index, city, street, apartment}"]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({ address: 1 });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'address.nested property address must be object with fields: {index, city, street, apartment}',
            ]);
        });

        test('(VAILDATION) [by Admin] should return 400 with message [{index, city, street, apartment} must be a string and should not be empty]', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${userData.dto._id}`)
                .set('Authorization', `Bearer ${adminData.accessToken}`)
                .send({
                    address: {},
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toEqual([
                'address.index must be a string',
                'address.index should not be empty',
                'address.city must be a string',
                'address.city should not be empty',
                'address.street must be a string',
                'address.street should not be empty',
                'address.apartment must be a string',
                'address.apartment should not be empty',
            ]);
        });
    });

    describe('/users (GET)', () => {
        test('(SUCCESS) [by Admin] should return 200 and user data object', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users`)
                .set('Authorization', `Bearer ${adminData.accessToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        _id: expect.any(String),
                        email: expect.any(String),
                    }),
                ]),
            );
        });

        test('(ERROR) should return 401 if send invalid access JWT', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users`)
                .set('Authorization', `Bearer INVALID.access.Token`);

            expect(response.statusCode).toBe(401);
        });

        test('(ERROR) [by User] should return 403 if send user access JWT', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users`)
                .set('Authorization', `Bearer ${userData.accessToken}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('[ TEST MUST BE LAST ] "user.deleted" (RMQ)', () => {
        test('(SUCCESS) [admin] should return deleted user data object', async () => {
            const user = await rmqService.triggerRoute<MsgUserDeletedDto, UserModel>(
                'user.deleted',
                {
                    userId: adminData.dto._id,
                },
            );
            expect(user._id.toString()).toBe(adminData.dto._id);
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
