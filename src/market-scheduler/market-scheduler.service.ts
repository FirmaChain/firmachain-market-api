import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainMarketService } from 'src/chain-market/chain-market.service';
import { Erc20MarketService } from 'src/erc20-market/erc20-market.service';
import { winstonLogger } from 'src/util/winston.util';

@Injectable()
export class MarketSchedulerService {
  private chainInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;

  private chainIntervalTime: number = 0;
  private erc20IntervalTime: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMarketService: ChainMarketService,
    private readonly erc20MarketService: Erc20MarketService
  ) {
    winstonLogger.log(`START MARKET SERVICE`);

    this.chainIntervalTime = this.configService.get("CHAIN_INTERVAL_TIME");
    this.erc20IntervalTime = this.configService.get("ERC20_INTERVAL_TIME");

    this.startChainInterval();
    this.startErc20SupplyInterval();
  }

  startChainInterval() {
    this.chainInterval = setInterval(async () => {
      try {
        winstonLogger.log(`🟦 START SCHEDULE - Mainnet (${new Date()}) 🟦`);

        const chainData = await this.chainMarketService.setChainData();
        const supplyData = await this.chainMarketService.setSupplyData();

        global.chainData = chainData;
        global.supplyData = supplyData;

      } catch (e) {
        winstonLogger.error(e);
      }
    }, this.chainIntervalTime * 1000);
  }

  startErc20SupplyInterval() {
    this.erc20Interval = setInterval(async () => {
      try {
        winstonLogger.log(`🟫 START SCHEDULE - Erc20 (${new Date()}) 🟫`);

        await this.erc20MarketService.setMarketData();
      } catch (e) {
        winstonLogger.error(e);
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
