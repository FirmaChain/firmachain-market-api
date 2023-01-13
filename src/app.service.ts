import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import moment from "moment";

import { UPBIT_DATA } from './interfaces/interface';

import { getPrice } from './components/coingecko';
import { getMainnetCirculatingSupply } from './components/firmachain';
import { getLiquidityInfo } from './components/liquidityInfo';
import { WALLET_AMOUNT } from './dtos/wallet.dto';
import { jsonToCSV } from './components/json2csv';
import { SUPPLY_DATE_DATA } from './dtos/supply.dto';
import FirmaUtils from './components/firmaUtil';

@Injectable()
export class AppService implements OnModuleInit {
  private mainnetDataList: UPBIT_DATA[];
  private erc20DataList: UPBIT_DATA[];
  private topAvailableWalletList: WALLET_AMOUNT[];
  private lastUpdatedSupplyDateData: SUPPLY_DATE_DATA;

  private mainnetFilePath: string;
  private erc20FilePath: string;
  private topAvailableFilePath: string;
  private lastUpdatedSupplyDatePath: string;

  private mainnetInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;
  private topAvailableInterval: NodeJS.Timer = null;

  private scheduleCycle: number = 0;
  private topAvailableScheduleCycle: number = 0;

  async onModuleInit() {
    console.log("START SERVICE");

    // 1000(1 second) * 60 = 1 minute
    this.scheduleCycle = 1000 * 120;
    this.topAvailableScheduleCycle = 1000 * 60 * 60;
    
    this.initJsonFile();
    this.loadJsonFile();

    this.startMainnetSchedule();
    this.startErc20Schedule();
    this.startTopAvailableAmountWalletSchedule();
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

  getTopAvailableAmountWallet(len: number): WALLET_AMOUNT[] {
    let topAvailableJSON = fs.readFileSync(this.topAvailableFilePath, { encoding: 'utf-8' });
    const topAvailableWalletList = JSON.parse(topAvailableJSON);
    return topAvailableWalletList["list"].slice(0, len);
  }

  saveJsonToCSV(len: number) {
    let data = [...this.topAvailableWalletList["list"].slice(0, len)];
    const csv = jsonToCSV(data);
    return csv;
  }

  initJsonFile() {
    this.mainnetFilePath = './public/mainnet.json';
    this.erc20FilePath = './public/erc20.json';
    this.topAvailableFilePath = './public/topAvailable.json';
    this.lastUpdatedSupplyDatePath = './public/lastUpdatedSupplyDate.json';

    const initContents = { list: [] };
    const initSupplyContents = { lastUpdatedDate: '' };

    if (!fs.existsSync(this.mainnetFilePath)) {
      fs.writeFileSync(this.mainnetFilePath, JSON.stringify(initContents));
    }
    if (!fs.existsSync(this.erc20FilePath)) {
      fs.writeFileSync(this.erc20FilePath, JSON.stringify(initContents));
    }

    if (!fs.existsSync(this.topAvailableFilePath)) {
      fs.writeFileSync(this.topAvailableFilePath, JSON.stringify(initContents));
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

    let topAvailableJSON = fs.readFileSync(this.topAvailableFilePath, { encoding: 'utf-8' });
    this.topAvailableWalletList = JSON.parse(topAvailableJSON);

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
          continue ;
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

  startTopAvailableAmountWalletSchedule() {
    this.topAvailableInterval = setInterval(async () => {
      console.log("[TOP_AVAILABLE][PARSING] START PARSING");

      const firmaUtils = await FirmaUtils();
      const addressList = await firmaUtils.getAddressList();
      this.topAvailableWalletList["list"] = addressList;

      console.log("[TOP_AVAILABLE][PARSING] SUCCESS WRITE FILE");
      fs.writeFileSync(this.topAvailableFilePath, JSON.stringify(this.topAvailableWalletList));

    }, this.topAvailableScheduleCycle);
  }
}
