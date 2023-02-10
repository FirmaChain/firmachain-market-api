import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ChainMarketService } from 'src/chain-market/chain-market.service';
import { ChainSupplyService } from 'src/chain-supply/chain-supply.service';
import { MarketSchedulerService } from './market-scheduler.service';

@Module({
  providers: [
    ConfigService,
    MarketSchedulerService,
    ChainMarketService,
    ChainSupplyService
  ]
})
export class MarketSchedulerModule {}
