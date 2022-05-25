import moment from "moment";
import { getAxios } from "./axios";
import account from "../../public/account.json";

const UNSIGNED_DIGITS = 1000000;

export async function getMainnetCirculatingSupply() {
  const supplyPath: string = `/cosmos/bank/v1beta1/supply`;
  let supply = await getAxios(process.env.LCD_URI, supplyPath);
  let totalSupply: number = 0;
  
  for (supply of supply.data.supply) {
    if (supply["denom"] === "ufct") {
      totalSupply = supply["amount"] / UNSIGNED_DIGITS;
    }
  }

  let accountList = [];
  account["accounts"].map((elem) => {
    if (elem["@type"] === "/cosmos.vesting.v1beta1.PeriodicVestingAccount")
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

  let circulatingSupply:number = totalSupply - (totalVesting - expiredVesting);

  return {
    totalSupply,
    circulatingSupply
  }
}