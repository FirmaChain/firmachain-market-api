import { Controller, Get, HttpCode, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { UPBIT_DATA } from './interfaces/interface';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService
  ) {}

  @HttpCode(200)
  @Get('health')
  health(): string {
    return this.appService.health();
  }

  @HttpCode(200)
  @Get('mainnet/info')
  getMainnetData(): UPBIT_DATA[] {
    return this.appService.getMainnetData();
  }

  @HttpCode(200)
  @Get('mainnet/info/circulating-supply')
  getMainnetSupplyData(): number {
    return this.appService.getMainnetSupplyData();
  }

  @HttpCode(200)
  @Get('mainnet/info/total-supply')
  getMainnetTotalSupplyData(): number {
    return this.appService.getMainnetTotalSupplyData();
  }

  @HttpCode(200)
  @Get('erc20/info')
  getErc20Data() {
    return this.appService.getErc20Data();
  }

  @HttpCode(200)
  @Get('erc20/info/circulating-supply')
  getErc20SupplyData(): number {
    return this.appService.getErc20SupplyData();
  }
}
