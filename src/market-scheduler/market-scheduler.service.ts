import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ChainMarketService } from 'src/chain-market/chain-market.service';

@Injectable()
export class MarketSchedulerService {
  private chainInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;
  
  private chainIntervalTime: number = 0;
  private erc20IntervalTime: number = 0;

  constructor(
    private readonly chainMarketService: ChainMarketService,
    private readonly configService: ConfigService
  ) {
    console.log("✅ START MARKET SERVICE ✅");

    this.chainIntervalTime = this.configService.get("CHAIN_INTERVAL_TIME");
    this.erc20IntervalTime = this.configService.get("ERC20_INTERVAL_TIME");

    this.startChainInterval();
    this.startErc20SupplyInterval();
  }

  startChainInterval() {
    this.chainInterval = setInterval(async () => {
      try {
        console.log("🟦 START SCHEDULE - Mainnet 🟦");

        await this.chainMarketService.setMarketData();
      } catch (e) {
        console.log(e);
      }
    }, this.chainIntervalTime * 1000);
  }

  startErc20SupplyInterval() {
    this.erc20Interval = setInterval(async () => {
      try {
        console.log("🟫 START SCHEDULE - Erc20 🟫");

        // await this.marketDataService.setMainnetMarketData();
      } catch (e) {
        console.log(e);
      }
    }, this.erc20IntervalTime * 1000);
  }

  stopChainSupplyInterval() {
    clearInterval(this.chainInterval);
  }

  stopErc20SupplyInterval() {
    clearInterval(this.erc20Interval);
  }
}
