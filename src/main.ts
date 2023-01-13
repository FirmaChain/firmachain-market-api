import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, );
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    // Block sql injection
    forbidUnknownValues: true
  }))
  await app.listen(process.env.PORT);
}
bootstrap();