import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('Users microservice')
        .setDescription('The Users')
        .setVersion('1.0')
        .addTag('Users')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/users/docs', app, document);

    await app.listen(3000);
}
bootstrap();
