import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './middlewares/LoggerMiddleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  controllers: [
    AppController,
  ],
  providers: [
    AppService
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    ScheduleModule.forRoot(),
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AppController);
  }
}
