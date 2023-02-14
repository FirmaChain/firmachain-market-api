import { Controller, Get, HttpCode } from '@nestjs/common';

import { Erc20MarketService } from './erc20-market/erc20-market.service';
import { CHAIN_DATA, MARKET_DATA, SUPPLY_DATA } from './interfaces/interface';

@Controller('api')
export class AppController {
  constructor(
    private readonly erc20MarketService: Erc20MarketService
  ) {}

  @HttpCode(200)
  @Get('health')
  health(): string {
    return 'healthcheck';
  }

  @Get('mainnet/refresh-data')
  async refreshMainnetData() {
    
  }

  @HttpCode(200)
  @Get('mainnet/info')
  async getMainnetData() {
    const chainData: CHAIN_DATA = global.chainData;
    const supplyData: SUPPLY_DATA = global.supplyData;

    const marketData: MARKET_DATA[] = [];

    for (let i = 0; i < chainData.currencyDatas.length; i++) {
      const currencyData = chainData.currencyDatas[i];
      
      marketData.push({
        symbol: chainData.symbol,
        currencyCode: currencyData.currencyCode,
        price: currencyData.price,
        marketCap: currencyData.price * supplyData.circulatingSupply,
        accTradePrice24h: currencyData.accTradePrice24h,
        circulatingSupply: supplyData.circulatingSupply,
        maxSupply: supplyData.maxSupply,
        provider: chainData.provider,
        lastUpdatedTimestamp: chainData.lastUpdatedTimestamp
      });
    }

    return marketData;
  }

  @HttpCode(200)
  @Get('mainnet/info/circulating-supply')
  async getMainnetSupplyData() {
    const supplyData: SUPPLY_DATA = global.supplyData;
    return supplyData.circulatingSupply;
  }

  @HttpCode(200)
  @Get('mainnet/info/total-supply')
  async getMainnetMaxSupplyData() {
    const supplyData: SUPPLY_DATA = global.supplyData;
    return supplyData.maxSupply;
  }

  @HttpCode(200)
  @Get('erc20/info')
  async getErc20Data() {
    try {
      return await this.erc20MarketService.getMarketData();
    } catch (e) {
      return e.response;
    }
  }

  @HttpCode(200)
  @Get('erc20/info/circulating-supply')
  async getErc20SupplyData() {
    try {
      return await this.erc20MarketService.getCirculatingSupply();
    } catch (e) {
      return e.response;
    }
  }
}
