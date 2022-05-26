import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';

import { UPBIT_DATA } from './interfaces/interface';

import { getPrice } from './components/coingecko';
import { getMainnetCirculatingSupply } from './components/firmachain';
import { getLiquidityInfo } from './components/liquidityInfo';
import { ACCOUNT_BALANCES } from './queries/wallet.query';
import { startFetch } from './components/fetch';
import { WALLET_AMOUNT } from './dtos/wallet.dto';
import { jsonToCSV } from './components/json2csv';

@Injectable()
export class AppService implements OnModuleInit {
  private mainnetDataList: UPBIT_DATA[];
  private erc20DataList: UPBIT_DATA[];
  private topAvailableWalletList: WALLET_AMOUNT[];

  private mainnetFilePath: string;
  private erc20FilePath: string;
  private topAvailableFilePath: string;

  private mainnetInterval: NodeJS.Timer = null;
  private erc20Interval: NodeJS.Timer = null;
  private topAvailableInterval: NodeJS.Timer = null;

  private scheduleCycle: number = 0;
  private topAvailableScheduleCycle: number = 0;

  async onModuleInit() {
    console.log("START SERVICE");

    // 1000(1 second) * 60 = 1 minute
    this.scheduleCycle = 1000 * 60;
    this.topAvailableScheduleCycle = 1000 * 60 * 5;

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
    return this.mainnetDataList["list"];
  }

  getMainnetSupplyData(): number {
    return this.mainnetDataList["list"][0].circulatingSupply;
  }

  getMainnetTotalSupplyData(): number {
    return this.mainnetDataList["list"][0].maxSupply;
  }

  getErc20Data(): UPBIT_DATA[] {
    return this.erc20DataList["list"];
  }

  getErc20SupplyData(): number {
    return this.erc20DataList["list"][0].circulatingSupply;
  }
  
  getTopAvailableAmountWallet(len: number): WALLET_AMOUNT[] {
    return this.topAvailableWalletList["list"].slice(0, len);
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

    const initContents = { list: [] };
    if (!fs.existsSync(this.mainnetFilePath)) {
      fs.writeFileSync(this.mainnetFilePath, JSON.stringify(initContents));
    }

    if (!fs.existsSync(this.erc20FilePath)) {
      fs.writeFileSync(this.erc20FilePath, JSON.stringify(initContents));
    }

    if (!fs.existsSync(this.topAvailableFilePath)) {
      fs.writeFileSync(this.topAvailableFilePath, JSON.stringify(initContents));
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
  }

  startMainnetSchedule() {
    // Start Interval
    this.mainnetInterval = setInterval(async () => {
      // TIMESTAMP
      const lastUpdatedTimestamp = Date.now();
      const supplyInfo = await getMainnetCirculatingSupply();

      this.mainnetDataList["list"].map(async (elem: UPBIT_DATA) => {
        console.log("[MAINNET][PARSING] START PARSING");
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
      console.log("[MAINNET][PARSING] SUCCESS WRITE FILE");
    }, this.scheduleCycle);
  }

  startErc20Schedule() {
    // Start Interval
    this.erc20Interval = setInterval(() => {
      // TIMESTAMP
      const lastUpdatedTimestamp = Date.now();
      const erc20CiculatingSupply = getLiquidityInfo().erc20;

      this.erc20DataList["list"].map(async (elem: UPBIT_DATA) => {
        console.log("[ERC20][PARSING] START PARSING");
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
      fs.writeFileSync(this.erc20FilePath, JSON.stringify(this.erc20DataList));
      console.log("[ERC20][PARSING] SUCCESS WRITE FILE");
    }, this.scheduleCycle);
  }

  startTopAvailableAmountWalletSchedule() {
    this.topAvailableInterval = setInterval(async () => {
      console.log("[TOP_AVAILABLE][PARSING] START PARSING");

      const fetchData = await startFetch(ACCOUNT_BALANCES.query, ACCOUNT_BALANCES.operationName, ACCOUNT_BALANCES.variables);
      const accountBalances = fetchData.account_balance;
      let walletList: WALLET_AMOUNT[] = [];
      for (let i = 0; i < accountBalances.length; i++) {
        if (accountBalances[i].coins.length === 0) continue;

        walletList.push({
          address: accountBalances[i].address,
          amount: Number(accountBalances[i].coins[0].amount)
        });
      }
      this.topAvailableWalletList["list"] = walletList.sort(this.sortWalletAmount).splice(0, 50);
      
      console.log("[TOP_AVAILABLE][PARSING] SUCCESS WRITE FILE");
      fs.writeFileSync(this.topAvailableFilePath, JSON.stringify(this.topAvailableWalletList));
    }, this.topAvailableScheduleCycle);
  }

  private sortWalletAmount(a: WALLET_AMOUNT, b: WALLET_AMOUNT) {
    if (a.amount > b.amount) {
      return -1;
    }

    if (a.amount < b.amount) {
      return 1;
    }

    return 0;
  }
}
