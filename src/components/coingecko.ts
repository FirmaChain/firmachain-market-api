import { getAxios } from "./axios";

const COIN_GECKO_URL: string = 'https://api.coingecko.com/api/v3';

export async function getPrice(code:string) {
  const path: string = `/simple/price?ids=Firmachain&vs_currencies=${code}&include_24hr_vol=true`;
  return await getAxios(COIN_GECKO_URL, path);
}