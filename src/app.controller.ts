import { Controller, Get, HttpCode } from '@nestjs/common';

import { Erc20MarketService } from './erc20-market/erc20-market.service';
import { ChainMarketService } from './chain-market/chain-market.service';
import { ChainSupplyService } from './chain-supply/chain-supply.service';
import { InternalServerErrorException } from '@nestjs/common/exceptions';

@Controller('api')
export class AppController {
  constructor(
    private readonly chainMarketService: ChainMarketService,
    private readonly chainSupplyService: ChainSupplyService,
    private readonly erc20MarketService: Erc20MarketService
  ) {}

  @HttpCode(200)
  @Get('health')
  health(): string {
    return 'healthcheck';
  }

  @Get('mainnet/refresh-data')
  async refreshMainnetData() {
    try {
      return await this.chainMarketService.setMarketData();
    } catch (e) {
      return e.response;
    }
  }

  @HttpCode(200)
  @Get('mainnet/info')
  async getMainnetData() {
    try {
      return await this.chainMarketService.getMarketData();
    } catch (e) {
      return e.response;
    }
  }

  @HttpCode(200)
  @Get('mainnet/info/circulating-supply')
  async getMainnetSupplyData() {
    try {
      return (await this.chainSupplyService.getSupplyData()).circulatingSupply;
    } catch (e) {
      return e.response;
    }
  }

  @HttpCode(200)
  @Get('mainnet/info/total-supply')
  async getMainnetMaxSupplyData() {
    try {
      return (await this.chainSupplyService.getSupplyData()).maxSupply;
    } catch (e) {
      return e.response;
    }
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
