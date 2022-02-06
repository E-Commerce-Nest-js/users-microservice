import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RMQModule } from 'nestjs-rmq';
import { TypegooseModule } from 'nestjs-typegoose';
import { getMongoConfig } from './configs/mongo.config';
import { getRmqConfig } from './configs/rabbitmq.config';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypegooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getMongoConfig,
        }),
        RMQModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getRmqConfig,
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
