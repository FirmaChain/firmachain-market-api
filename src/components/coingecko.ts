import { winstonLogger } from "src/util/winston.util";
import { getAxios } from "../util/axios.util";

const COIN_GECKO_URL: string = 'https://api.coingecko.com/api/v3';

export async function getPrice(code: string, provider: string) {
  const path: string = `/simple/price?ids=${provider}&vs_currencies=${code}&include_24hr_vol=true`;
  
  try {
    const priceData = await getAxios(COIN_GECKO_URL, path);
    return priceData.data[provider];
  } catch (e) {
    winstonLogger.error(`[ERROR] - ${COIN_GECKO_URL}${path} || ${e}`);
    throw "could not coingecko price data";
  }
}