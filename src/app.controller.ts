import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
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
  @Get('erc20/info')
  getErc20Data() {
    return this.appService.getErc20Data();
  }
}
