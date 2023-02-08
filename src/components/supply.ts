import moment from 'moment';

import { getAxios } from '../util/axios';
import account from '../account.json';
import { SUPPLY_INFO } from 'src/interfaces/interface';
import { ReadFile, WriteFile } from 'src/util/file';

const UNSIGNED_DIGITS = 1000000;
const SUPPLY_DATA_FILENAME = "supplyData.json";

export const getMainnetSupplyData = async () => {
  const currentSupplyData = await readSupplyData();

  // get date
  const timerDate = moment(new Date()).utcOffset(540);
  const nowSupplyDate = timerDate.format('YYYYMMDD');
  
  // check updated date
  if (currentSupplyData.lastUpdatedDate === "" || currentSupplyData.lastUpdatedDate !== nowSupplyDate) {
    console.log(`✅ NEXT DATE - Before Date: ${currentSupplyData.lastUpdatedDate}, Now Date: ${nowSupplyDate} ✅`);
    const newSupplyInfo = new SUPPLY_INFO();
    const newSupplyData = await circulatingSupplyData();
    
    newSupplyInfo.lastUpdatedDate = nowSupplyDate;
    newSupplyInfo.circulatingSupply = newSupplyData.circulatingSupply;
    newSupplyInfo.maxSupply = newSupplyData.maxSupply;
    
    // write supply info
    await writeSupplyData(newSupplyInfo);

    return newSupplyInfo;
  }

  return currentSupplyData;
}

const readSupplyData = async () => {
  try {
    const supplyData = await ReadFile(SUPPLY_DATA_FILENAME);
    const supplyInfo: SUPPLY_INFO = JSON.parse(supplyData);

    return supplyInfo;
  } catch (e) {
    return (new SUPPLY_INFO());
  }
}

async function writeSupplyData(supplyInfo: SUPPLY_INFO) {
  try {
    await WriteFile(SUPPLY_DATA_FILENAME, JSON.stringify(supplyInfo));

    return true;
  } catch (e) {
    console.log("Failed - write file of supply data");
    return false;
  }
}

async function circulatingSupplyData() {
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
        maxSupply = supply['amount'] / UNSIGNED_DIGITS;
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

    totalVesting /= UNSIGNED_DIGITS;
    expiredVesting /= UNSIGNED_DIGITS;

    let circulatingSupply: number = Number(
      (maxSupply - (totalVesting - expiredVesting) - communityPool).toFixed(6),
    );

    return {
      maxSupply,
      circulatingSupply,
    };
  } catch (e) {
    return {
      maxSupply: 0,
      circulatingSupply: 0
    }
  }
}
