import { Injectable, InternalServerErrorException } from '@nestjs/common';
import moment from 'moment';

import { SUPPLY_DATA } from 'src/interfaces/interface';
import { getAxios } from 'src/util/axios';
import { ReadFile, WriteFile } from 'src/util/file';
import account from '../account.json';

@Injectable()
export class ChainSupplyService {
  private SUPPLY_DATA_FILE_NAME: string = "supplyData.json";
  private UNSIGNED_DIGITS = 1000000;

  async getSupplyData() {
    try {
      const currentSupplyData = await this.getSupplyDataFromJsonFile();

      const isNeedUpdate = await this.isNeedUpdateSupplyData(currentSupplyData.lastUpdatedDate);
      if (isNeedUpdate === true) {
        return this.setNewSupplyDataIntheJsonFile()
      }

      return currentSupplyData;
    } catch (e) {
      throw e;
    }
  }

  private async getSupplyDataFromJsonFile() {
    try {
      const readData = await ReadFile(this.SUPPLY_DATA_FILE_NAME);
      const supplyData: SUPPLY_DATA = JSON.parse(readData);

      return supplyData;
    } catch (e) {
      return new SUPPLY_DATA();
    }
  }

  private async isNeedUpdateSupplyData(updateDate: string) {
    // get date
    const timerDate = moment(new Date()).utcOffset(540);
    const nowSupplyDate = timerDate.format('YYYYMMDD');

    if (updateDate !== nowSupplyDate) {
      return true;
    }

    return false;
  }

  private async setNewSupplyDataIntheJsonFile() {
    try {
      const newCalcSupplyData = await this.calcSupplyData();

      if (newCalcSupplyData !== null) {
        const timerDate = moment(new Date()).utcOffset(540);
        const nowSupplyDate = timerDate.format('YYYYMMDD');

        const newSupplyData: SUPPLY_DATA = {
          lastUpdatedDate: nowSupplyDate,
          circulatingSupply: newCalcSupplyData.circulatingSupply,
          maxSupply: newCalcSupplyData.maxSupply
        };

        await WriteFile(this.SUPPLY_DATA_FILE_NAME, JSON.stringify(newSupplyData));

        return newSupplyData;
      }
    } catch (e) {
      throw e;
    }
  }

  private async calcSupplyData() {
    try {
      const supplyPath: string = `/cosmos/bank/v1beta1/supply`;
      let supply = await getAxios(process.env.LCD_URI, supplyPath);
      let maxSupply: number = 0;

      const communityPoolPath: string = `/cosmos/distribution/v1beta1/community_pool`;
      const communityPoolData = await getAxios(
        process.env.LCD_URI,
        communityPoolPath,
      );
      const communityPool =
        Number(communityPoolData.data.pool[0].amount) / Math.pow(10, 6);

      for (supply of supply.data.supply) {
        if (supply['denom'] === 'ufct') {
          maxSupply = supply['amount'] / this.UNSIGNED_DIGITS;
        }
      }

      let accountList = [];
      account['accounts'].map((elem) => {
        if (elem['@type'] === '/cosmos.vesting.v1beta1.PeriodicVestingAccount')
          accountList.push(elem);
      });

      let expiredVesting = 0;
      let totalVesting = 0;

      accountList.map((account) => {
        totalVesting += account.base_vesting_account.original_vesting[0].amount * 1;

        let endTimeAcc = account.start_time * 1;

        account.vesting_periods.map((value) => {
          endTimeAcc += value.length * 1;

          if (endTimeAcc <= moment().unix()) {
            expiredVesting += value.amount[0].amount * 1;
          }
        });
      });

      totalVesting /= this.UNSIGNED_DIGITS;
      expiredVesting /= this.UNSIGNED_DIGITS;

      let circulatingSupply: number = Number(
        (maxSupply - (totalVesting - expiredVesting) - communityPool).toFixed(6),
      );

      return {
        maxSupply,
        circulatingSupply,
      };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('[ERROR] FAILED TO CALC THE SUPPLY DATA');
    }
  }
}
