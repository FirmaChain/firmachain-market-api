import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';

import { getPrice } from 'src/components/coingecko';
import { CHAIN_DATA, SUPPLY_DATA } from 'src/interfaces/interface';
import { getAxios } from 'src/util/axios';
import { ExistsFile, ReadFile, WriteFile } from 'src/util/file';
import account from '../account.json';

@Injectable()
export class ChainMarketService {
	private CHAIN_DATA_FILE_NAME: string;
	private SUPPLY_DATA_FILE_NAME: string;

	private UNSIGNED_DIGITS = 1000000;

	constructor(private readonly configService: ConfigService) {
		this.CHAIN_DATA_FILE_NAME = this.configService.get("CHAIN_DATA_FILE_NAME");
		this.SUPPLY_DATA_FILE_NAME = this.configService.get("SUPPLY_DATA_FILE_NAME");

		this.initialize();
	}

	async initialize() {
		if (await ExistsFile(this.CHAIN_DATA_FILE_NAME)) {
			const readChainData = await ReadFile(this.CHAIN_DATA_FILE_NAME);
			global.chainData = JSON.parse(readChainData);
		} else {
			global.chainData = await this.setChainData();
		}

		if (await ExistsFile(this.SUPPLY_DATA_FILE_NAME)) {
			const readSupplyData = await ReadFile(this.SUPPLY_DATA_FILE_NAME);
			global.supplyData = JSON.parse(readSupplyData);
		} else {
			global.supplyData = await this.setSupplyData();
		}
	}

	async setChainData() {
		try {
			const chainData = new CHAIN_DATA();
			chainData.symbol = "FCT2";
			chainData.provider = "firmachain";
			chainData.lastUpdatedTimestamp = Date.now();
			chainData.currencyDatas = [];

			// Check environment "CODE" variables in 'app.module'
			const currencyCodeString = this.configService.get("CODE");
			const currencyCodes: string[] = currencyCodeString.split(',');

			for (let i = 0; i < currencyCodes.length; i++) {
				const currencyCode = currencyCodes[i];

				const priceData = await getPrice(currencyCode, chainData.provider);

				chainData.currencyDatas.push({
					currencyCode: currencyCode,
					price: priceData[currencyCode.toLowerCase()],
					accTradePrice24h: priceData[`${currencyCode.toLowerCase()}_24h_vol`]
				});
			}

			// Save local file & return data
			await WriteFile(this.CHAIN_DATA_FILE_NAME, JSON.stringify(chainData));

			return chainData;
		} catch (e) {
			console.log(`[ERROR] - setChainData`);
			throw new InternalServerErrorException("Failed while configuring chain data");
		}
	}

	async setSupplyData() {
		try {
			const originSupplyData: SUPPLY_DATA = global.supplyData;

			const isNeedUpdate = this.isNeedUpdateSupplyData(originSupplyData);

			if (isNeedUpdate) {
				const supplyData = await this.updateSupplyData();

				return supplyData;
			}

			return originSupplyData;
		} catch (e) {
			console.log(`[ERROR] - setSupplyData`);
			throw e.response;
		}
	}

	private isNeedUpdateSupplyData(supplyData: SUPPLY_DATA) {
		const timerDate = moment(new Date()).utcOffset(540);
		const nowSupplyDate = timerDate.format('YYYYMMDD');

		if (supplyData === undefined || supplyData === null) {
			return true;
		}
		else if (supplyData.lastUpdatedDate !== nowSupplyDate) {
			return true;
		}

		return false;
	}

	private async updateSupplyData() {
		try {
			console.log("[INFO] - updateSupplyData");
			const newCalcSupplyData = await this.calcSupplyData();
			const timerDate = moment(new Date()).utcOffset(540);
			const nowSupplyDate = timerDate.format('YYYYMMDD');

			const supplyData: SUPPLY_DATA = {
				lastUpdatedDate: nowSupplyDate,
				circulatingSupply: newCalcSupplyData.circulatingSupply,
				maxSupply: newCalcSupplyData.maxSupply
			};

			await WriteFile(this.SUPPLY_DATA_FILE_NAME, JSON.stringify(supplyData));

			return supplyData;
		} catch (e) {
			console.log(`[ERROR] - updateSupplyData`);
			throw e.response;
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
