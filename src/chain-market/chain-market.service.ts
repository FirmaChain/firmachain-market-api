import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainSupplyService } from 'src/chain-supply/chain-supply.service';
import { getPrice } from 'src/components/coingecko';

import { MARKET_DATA } from 'src/interfaces/interface';
import { ExistsFile, ReadFile, WriteFile } from 'src/util/file';

@Injectable()
export class ChainMarketService {
  constructor(
    private readonly configService: ConfigService,
    private readonly chainSupplyService: ChainSupplyService
  ) { }
  private chainMarketFileName: string = 'chainMarketData.json';

  async getMarketData() {
    try {
      const isExistsFile = await ExistsFile(this.chainMarketFileName);

    if (isExistsFile === true) {
      const readData = await ReadFile(`${this.chainMarketFileName}`);
      const parseSupplyData: MARKET_DATA[] = JSON.parse(readData);

      return parseSupplyData;
    }

    // TODO set market data
    const supplyData = await this.setMarketData();
    
    return supplyData;
    } catch (e) {
      throw e;
    }
  }

  async setMarketData() {
    try {
      const finalMarketDatas: MARKET_DATA[] = [];

      // Check environment "CODE" variables in 'app.module'
      const currencyCodeString = this.configService.get("CODE");
      const currencyCodes = currencyCodeString.split(',');
      const nowDate = Date.now();
      const provider = "firmachain";

      const chainSupplyInfo = await this.chainSupplyService.getSupplyData();

      for (let i = 0; i < currencyCodes.length; i++) {
        const currencyCode = currencyCodes[i];

        const priceInfo = await getPrice(currencyCode, provider);

        const elem = new MARKET_DATA();

        // supply
        elem.circulatingSupply = chainSupplyInfo.circulatingSupply;
        elem.maxSupply = chainSupplyInfo.maxSupply;

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
        finalMarketDatas.push(elem);
      }

      await WriteFile(this.chainMarketFileName, JSON.stringify(finalMarketDatas));

      return finalMarketDatas;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('calcSupplyData');
    }
  }
}
