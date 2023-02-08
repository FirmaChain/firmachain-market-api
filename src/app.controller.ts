import { Controller, Get, HttpCode } from '@nestjs/common';
import { Erc20MarketService } from './erc20-market/erc20-market.service';
import { MainnetMarketService } from './mainnet-market/mainnet-market.service';

@Controller('api')
export class AppController {
  constructor(
    private readonly mainnetMarketService: MainnetMarketService,
    private readonly erc20MarketService: Erc20MarketService
  ) {}

  @HttpCode(200)
  @Get('health')
  health(): string {
    return 'healthcheck';
  }

  @Get('mainnet/refresh-data')
  async refreshMainnetData() {
    return await this.mainnetMarketService.setMarketData();
  }
  
  @HttpCode(200)
  @Get('mainnet/info')
  async getMainnetData() {
    return await this.mainnetMarketService.getMarketData();
  }

  @HttpCode(200)
  @Get('mainnet/info/circulating-supply')
  async getMainnetSupplyData() {
    return await this.mainnetMarketService.getCirculatingSupply();
  }

  @HttpCode(200)
  @Get('mainnet/info/total-supply')
  async getMainnetMaxSupplyData() {
    return await this.mainnetMarketService.getMaxSupply();
  }

  @HttpCode(200)
  @Get('erc20/info')
  async getErc20Data() {
    return await this.erc20MarketService.getMarketData();
  }

  @HttpCode(200)
  @Get('erc20/info/circulating-supply')
  async getErc20SupplyData() {
    return await this.erc20MarketService.getCirculatingSupply();
  }
}
