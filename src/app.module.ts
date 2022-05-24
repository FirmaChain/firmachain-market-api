import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './middlewares/LoggerMiddleware';

@Module({
  controllers: [AppController,],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AppController);
  }
}
