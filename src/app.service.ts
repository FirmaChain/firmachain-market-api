import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import moment from "moment";

import { UPBIT_DATA } from './interfaces/interface';

import { getPrice } from './components/coingecko';
import { getMainnetCirculatingSupply } from './components/firmachain';
import { getLiquidityInfo } from './components/liquidityInfo';
import { SUPPLY_DATE_DATA } from './dtos/supply.dto';

@Injectable()
export class AppService implements OnModuleInit {
  private mainnetDataList: UPBIT_DATA[];
  private erc20DataList: UPBIT_DATA[];
  private lastUpdatedSupplyDateData: SUPPLY_DATE_DATA;

  private mainnetFilePath: string;
  private erc20FilePath: string;
  private lastUpdatedSupplyDatePath: string;

  private mainnetInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;
  private topAvailableInterval: NodeJS.Timer = null;

  private scheduleCycle: number = 0;

  async onModuleInit() {
    console.log("START SERVICE");

    // 1000(1 second) * 60 = 1 minute
    this.scheduleCycle = 1000 * 120;

    this.initJsonFile();
    this.loadJsonFile();

    this.startMainnetSchedule();
    this.startErc20Schedule();
  }

  health(): string {
    return 'healthcheck';
  }

  getMainnetData(): UPBIT_DATA[] {
    let mainnetJSON = fs.readFileSync(this.mainnetFilePath, { encoding: 'utf-8' });
    const mainnetDataList = JSON.parse(mainnetJSON);
    return mainnetDataList["list"];
  }

  getMainnetSupplyData(): number {
    let mainnetJSON = fs.readFileSync(this.mainnetFilePath, { encoding: 'utf-8' });
    const mainnetDataList = JSON.parse(mainnetJSON);
    return mainnetDataList["list"][0].circulatingSupply;
  }

  getMainnetTotalSupplyData(): number {
    let mainnetJSON = fs.readFileSync(this.mainnetFilePath, { encoding: 'utf-8' });
    const mainnetDataList = JSON.parse(mainnetJSON);
    return mainnetDataList["list"][0].maxSupply;
  }

  getErc20Data(): UPBIT_DATA[] {
    return this.erc20DataList["list"];
  }

  getErc20SupplyData(): number {
    return this.erc20DataList["list"][0].circulatingSupply;
  }

  initJsonFile() {
    this.mainnetFilePath = './public/mainnet.json';
    this.erc20FilePath = './public/erc20.json';
    this.lastUpdatedSupplyDatePath = './public/lastUpdatedSupplyDate.json';

    const initContents = { list: [] };
    const initSupplyContents = { lastUpdatedDate: '' };

    if (!fs.existsSync(this.mainnetFilePath)) {
      fs.writeFileSync(this.mainnetFilePath, JSON.stringify(initContents));
    }
    if (!fs.existsSync(this.erc20FilePath)) {
      fs.writeFileSync(this.erc20FilePath, JSON.stringify(initContents));
    }

    if (!fs.existsSync(this.lastUpdatedSupplyDatePath)) {
      fs.writeFileSync(this.lastUpdatedSupplyDatePath, JSON.stringify(initSupplyContents));
    }
  }

  loadJsonFile() {
    // Initialize Data
    let mainnetJSON = fs.readFileSync(this.mainnetFilePath, { encoding: 'utf-8' });
    this.mainnetDataList = JSON.parse(mainnetJSON);

    let erc20JSON = fs.readFileSync(this.erc20FilePath, { encoding: 'utf-8' });
    this.erc20DataList = JSON.parse(erc20JSON);
    
    let lastUpdatedSupplyDateJSON = fs.readFileSync(this.lastUpdatedSupplyDatePath, { encoding: 'utf-8' });
    this.lastUpdatedSupplyDateData = JSON.parse(lastUpdatedSupplyDateJSON);
  }

  startMainnetSchedule() {
    this.mainnetInterval = setInterval(async () => {

      const mainnetDatas = this.mainnetDataList["list"];

      for (let i = 0; i < mainnetDatas.length; i++) {
        const elem: UPBIT_DATA = mainnetDatas[i];
        const currencyCode = elem.currencyCode;

        let priceData = null;

        try {
          priceData = (await getPrice(currencyCode)).data['firmachain'];
        } catch (e) {
          console.log(`[MAINNET] Error - getPrice : ${e}`);
          continue;
        }

        if (priceData === null) continue;

        const price = priceData[currencyCode.toLowerCase()];
        const vol24h = priceData[`${currencyCode.toLowerCase()}_24h_vol`];
        const marketCaps = price * elem.circulatingSupply;
        const providor = "firmachain";
        const lastUpdatedTimestamp = Date.now();

        elem.price = price;
        elem.accTradePrice24h = vol24h;
        elem.marketCap = marketCaps;
        elem.provider = providor;
        elem.lastUpdatedTimestamp = lastUpdatedTimestamp;

        mainnetDatas[i] = elem;
      }

      const timerDate = moment(new Date()).utcOffset(540);
      const nowSupplyDate = timerDate.format('YYYYMMDD');

      if (this.lastUpdatedSupplyDateData.lastUpdatedDate === '' ||
        this.lastUpdatedSupplyDateData.lastUpdatedDate !== nowSupplyDate) {
        console.log("[MAINNET][PARSING] Parse one time");

        let supplyInfo = null;

        try {
          supplyInfo = await getMainnetCirculatingSupply();
        } catch (e) {
          console.log(`Error - getCirculatingSupply : ${e}`);
        }

        for (let i = 0; i < mainnetDatas.length; i++) {
          const elem: UPBIT_DATA = mainnetDatas[i];

          elem.circulatingSupply = supplyInfo.circulatingSupply;
          elem.maxSupply = supplyInfo.totalSupply;
        }

        this.lastUpdatedSupplyDateData.lastUpdatedDate = nowSupplyDate;
        fs.writeFileSync(this.lastUpdatedSupplyDatePath, JSON.stringify(this.lastUpdatedSupplyDateData));
      }

      fs.writeFileSync(this.mainnetFilePath, JSON.stringify(this.mainnetDataList));
      console.log("[MAINNET][PARSING] SUCCESS WRITE FILE");

    }, this.scheduleCycle);
  }

  startErc20Schedule() {
    this.erc20Interval = setInterval(async () => {

      const erc20Datas = this.erc20DataList["list"];

      for (let i = 0; i < erc20Datas.length; i++) {
        const elem: UPBIT_DATA = erc20Datas[i];
        const currencyCode = elem.currencyCode;

        let priceData = null;
        try {
          priceData = (await getPrice(currencyCode)).data['firmachain'];
        } catch (e) {
          console.log(`[ERC20] Error - getPrice : ${e}`);
          continue;
        }

        if (priceData === null) continue;

        const price = priceData[currencyCode.toLowerCase()];
        const vol24h = priceData[currencyCode.toLowerCase() + '_24h_vol'];
        const marketCaps = price * elem.circulatingSupply;
        const providor = "firmachain";
        const lastUpdatedTimestamp = Date.now();
        const erc20CiculatingSupply = getLiquidityInfo().erc20;

        elem.price = price;
        elem.accTradePrice24h = vol24h;
        elem.marketCap = marketCaps;
        elem.provider = providor;
        elem.lastUpdatedTimestamp = lastUpdatedTimestamp;
        elem.circulatingSupply = erc20CiculatingSupply;
      }

      fs.writeFileSync(this.erc20FilePath, JSON.stringify(this.erc20DataList));
      console.log("[ERC20][PARSING] SUCCESS WRITE FILE");

    }, this.scheduleCycle);
  }
}
