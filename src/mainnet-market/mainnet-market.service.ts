import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { getPrice } from 'src/components/coingecko';
import { getMainnetSupplyData } from 'src/components/supply';
import { MARKET_DATA } from 'src/interfaces/interface';
import { ExistsFile, ReadFile, WriteFile } from 'src/util/file';

@Injectable()
export class MainnetMarketService {
  constructor(private readonly configService: ConfigService) { }
  private mainnetMarketFileName: string = 'mainnetMarket.json';
  
  async setMarketData() {
    try {
      const finalDataList: MARKET_DATA[] = [];

      // Check environment "CODE" variables in 'app.module'
      const currencyCodeString = this.configService.get("CODE");
      const currencyCodes = currencyCodeString.split(',');
      const nowDate = Date.now();
      const provider = "firmachain";

      // only one run
      const supplyInfo = await getMainnetSupplyData();

      for (let i = 0; i < currencyCodes.length; i++) {
        const currencyCode = currencyCodes[i];

        const elem = new MARKET_DATA();

        const priceInfo = await getPrice(currencyCode, provider);

        // supply
        elem.circulatingSupply = supplyInfo.circulatingSupply;
        elem.maxSupply = supplyInfo.maxSupply;

        // price
        elem.price = priceInfo[currencyCode.toLowerCase()];
        elem.accTradePrice24h = priceInfo[`${currencyCode.toLowerCase()}_24h_vol`];
        elem.marketCap = elem.price * elem.circulatingSupply;

        // fixed
        elem.symbol = "FCT2";
        elem.provider = provider;
        elem.currencyCode = currencyCode;

        // date
        elem.lastUpdatedTimestamp = nowDate;

        // add array
        finalDataList.push(elem);
      }

      await WriteFile(this.mainnetMarketFileName, JSON.stringify(finalDataList));

      return finalDataList;
    } catch (e) {
      console.log("setMainnetMarketData - error");
      return [];
    }
  }

  async getMarketData() {
    try {
      const isExistsFile = await ExistsFile(this.mainnetMarketFileName);

      if (isExistsFile) {
        const readData = await ReadFile(this.mainnetMarketFileName);
        const parseData: MARKET_DATA[] = JSON.parse(readData);

        return parseData;
      } else {
        const mainnetMarketData = await this.setMarketData();

        return mainnetMarketData;
      }
    } catch (e) {
      return [];
    }
  }

  async getCirculatingSupply() {
    try {
      const supplyData = await getMainnetSupplyData();

      return supplyData.circulatingSupply;
    } catch (e) {
      console.log(e);
      return 0;
    }
  }

  async getMaxSupply() {
    try {
      const supplyData = await getMainnetSupplyData();

      return supplyData.maxSupply;
    } catch (e) {
      console.log(e);
      return 0;
    }
  }
}
