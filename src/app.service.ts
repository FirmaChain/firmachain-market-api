import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';

import { UPBIT_DATA } from './interfaces/interface';

import { getPrice } from './components/coingecko';
import { getMainnetCirculatingSupply } from './components/firmachain';
import { getLiquidityInfo } from './components/liquidityInfo';

@Injectable()
export class AppService implements OnModuleInit {
  private mainnetDataList: UPBIT_DATA[];
  private erc20DataList: UPBIT_DATA[];

  private mainnetInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;

  private scheduleCycle: number = 0;

  async onModuleInit() {
    console.log("START SERVICE");

    // 1000(1 second) * 60 = 1 minute
    this.scheduleCycle = 1000 * 60;

    this.loadJsonFile();

    console.log();
    this.startMainnetSchedule();
    this.startErc20Schedule();
  }

  health(): string {
    return 'healthcheck';
  }

  getMainnetData(): UPBIT_DATA[] {
    return this.mainnetDataList["list"];
  }

  getErc20Data(): UPBIT_DATA[] {
    return this.erc20DataList["list"];
  }

  loadJsonFile() {
    // Initialize Data
    let mainnetJSON = fs.readFileSync('./public/mainnet.json', { encoding: 'utf-8' });
    this.mainnetDataList = JSON.parse(mainnetJSON);

    let erc20JSON = fs.readFileSync('./public/erc20.json', { encoding: 'utf-8' });
    this.erc20DataList = JSON.parse(erc20JSON);
  }

  startMainnetSchedule() {
    // Start Interval
    this.mainnetInterval = setInterval(async () => {
      // TIMESTAMP
      const lastUpdatedTimestamp = Date.now();
      const supplyInfo = await getMainnetCirculatingSupply();

      this.mainnetDataList["list"].map(async (elem: UPBIT_DATA) => {
        console.log("START PARSING");
        // PRICE
        const price = await getPrice(elem.currencyCode);
        elem.price = price.data['firmachain'][elem.currencyCode.toLowerCase()];
        // 24HOURS
        elem.accTradePrice24h = price.data['firmachain'][elem.currencyCode.toLowerCase() + '_24h_vol'];
        // circulatingSupply
        elem.circulatingSupply = supplyInfo.circulatingSupply;
        elem.maxSupply = supplyInfo.totalSupply;
        // Marketcap
        elem.marketCap = elem.price * elem.circulatingSupply;
        // Update Time
        elem.lastUpdatedTimestamp = lastUpdatedTimestamp;
      });
      // WRITE FILE
      fs.writeFileSync('./public/mainnet.json', JSON.stringify(this.mainnetDataList));
      console.log("SUCCESS WRITE FILE");
    }, this.scheduleCycle);
  }

  startErc20Schedule() {
    // Start Interval
    this.erc20Interval = setInterval(() => {
      // TIMESTAMP
      const lastUpdatedTimestamp = Date.now();
      const erc20CiculatingSupply = getLiquidityInfo().erc20;

      this.erc20DataList["list"].map(async (elem: UPBIT_DATA) => {
        console.log("START PARSING");
        // PRICE
        const price = await getPrice(elem.currencyCode);
        elem.price = price.data['firmachain'][elem.currencyCode.toLowerCase()];
        // 24HOURS
        elem.accTradePrice24h = price.data['firmachain'][elem.currencyCode.toLowerCase() + '_24h_vol'];
        // circulatingSupply
        elem.circulatingSupply = erc20CiculatingSupply;
        // Marketcap
        elem.marketCap = elem.price * elem.circulatingSupply;
        // Update Time
        elem.lastUpdatedTimestamp = lastUpdatedTimestamp;
      });
      // WRITE FILE
      fs.writeFileSync('./public/erc20.json', JSON.stringify(this.erc20DataList));
      console.log("SUCCESS WRITE FILE");
    }, this.scheduleCycle);
  }
}
