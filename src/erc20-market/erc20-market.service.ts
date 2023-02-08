import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getPrice } from 'src/components/coingecko';
import { LIQUIDITY_INFO, MARKET_DATA } from 'src/interfaces/interface';
import { ExistsFile, ReadFile, WriteFile } from 'src/util/file';

@Injectable()
export class Erc20MarketService {
  constructor(private readonly configService: ConfigService) { }
  private erc20MarketFileName: string = 'erc20Market.json';
  private erc20SupplyFileName: string = 'liquidityInfo.json';

  async setMarketData() {
    try {
      const finalDataList: MARKET_DATA[] = [];

      // Check environment "CODE" variables in 'app.module'
      const currencyCodeString = this.configService.get("CODE");
      const currencyCodes = currencyCodeString.split(',');
      const nowDate = Date.now();
      const provider = "firmachain";

      const supplyInfo = await this.getCirculatingSupply();

      for (let i = 0; i < currencyCodes.length; i++) {
        const currencyCode = currencyCodes[i];

        const elem = new MARKET_DATA();

        const priceInfo = await getPrice(currencyCode, provider);

        // supply
        elem.circulatingSupply = supplyInfo.erc20;
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

      await WriteFile(this.erc20MarketFileName, JSON.stringify(finalDataList));

      return finalDataList;
    } catch (e) {
      console.log("setErc20MarketData - error");
      return [];
    }
  }

  async getMarketData() {
    try {
      const isExistsFile = await ExistsFile(this.erc20MarketFileName);

      if (isExistsFile) {
        const readData = await ReadFile(this.erc20MarketFileName);
        const parseData: MARKET_DATA[] = JSON.parse(readData);

        return parseData;
      } else {
        return await this.setMarketData();
      }
    } catch (e) {
      return [];
    }
  }

  async getCirculatingSupply() {
    try {
      const isExistsFile = await ExistsFile(this.erc20SupplyFileName);

      if (isExistsFile) {
        const liquidityData = await ReadFile(this.erc20SupplyFileName);
        const liquidityInfo: LIQUIDITY_INFO = JSON.parse(liquidityData);

        return liquidityInfo;
      }

      return (new LIQUIDITY_INFO());
    } catch (e) {
      console.log(e);
      return (new LIQUIDITY_INFO());
    }
  }
}
