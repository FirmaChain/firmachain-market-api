import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MainnetMarketService } from 'src/mainnet-market/mainnet-market.service';
import { MarketSchedulerService } from './market-scheduler.service';

@Module({
  providers: [
    ConfigService,
    MarketSchedulerService,
    MainnetMarketService
  ]
})
export class MarketSchedulerModule {}
