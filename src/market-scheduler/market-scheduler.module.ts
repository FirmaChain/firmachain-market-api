import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainMarketService } from 'src/chain-market/chain-market.service';
import { Erc20MarketService } from 'src/erc20-market/erc20-market.service';

import { MarketSchedulerService } from './market-scheduler.service';

@Module({
  providers: [
    ConfigService,
    MarketSchedulerService,
    ChainMarketService,
    Erc20MarketService
  ]
})
export class MarketSchedulerModule {}
