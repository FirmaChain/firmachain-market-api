import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MainnetMarketService } from 'src/mainnet-market/mainnet-market.service';

@Injectable()
export class MarketSchedulerService {
  private mainnetInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;
  
  private mainnetIntervalTime: number = 0;
  private erc20IntervalTime: number = 0;

  constructor(
    private readonly mainnetMarketService: MainnetMarketService,
    private readonly configService: ConfigService
  ) {
    console.log("✅ START MARKET SERVICE ✅");

    this.mainnetIntervalTime = this.configService.get("MAINNET_INTERVAL_TIME");
    this.erc20IntervalTime = this.configService.get("ERC20_INTERVAL_TIME");

    this.startMainnetInterval();
    this.startErc20Interval();
  }

  startMainnetInterval() {
    this.mainnetInterval = setInterval(async () => {
      try {
        console.log("🟦 START SCHEDULE - Mainnet 🟦");

        await this.mainnetMarketService.setMarketData();
      } catch (e) {
        console.log(e);
      }
    }, this.mainnetIntervalTime * 1000);
  }

  startErc20Interval() {
    this.erc20Interval = setInterval(async () => {
      try {
        console.log("🟫 START SCHEDULE - Erc20 🟫");

        // await this.marketDataService.setMainnetMarketData();
      } catch (e) {
        console.log(e);
      }
    }, this.erc20IntervalTime * 1000);
  }

  stopMainnetInterval() {
    clearInterval(this.mainnetInterval);
  }

  stopErc20Interval() {
    clearInterval(this.erc20Interval);
  }
}
