import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from "@hapi/joi";

import { AppController } from './app.controller';
import { LoggerMiddleware } from './middlewares/LoggerMiddleware';
import { ChainMarketService } from './chain-market/chain-market.service';
import { MarketSchedulerModule } from './market-scheduler/market-scheduler.module';
import { Erc20MarketService } from './erc20-market/erc20-market.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.development' : process.env.NODE_ENV === 'test' ? '.env.test' : '.env.production',
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.string().required(),
        CODE: Joi.string().required(),
        LCD_URI: Joi.string().required(),
        CHAIN_INTERVAL_TIME: Joi.string().required(),
        ERC20_INTERVAL_TIME: Joi.string().required(),
      }),
    }),
    ScheduleModule.forRoot(),
    MarketSchedulerModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    ChainMarketService,
    Erc20MarketService,
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AppController);
  }
}