import { FirmaSDK } from "@firmachain/firma-js"
import { FirmaConfig } from "@firmachain/firma-js/dist/sdk/FirmaConfig";
import { ACCOUNT_DATA, ADDRESS_DATA } from "src/interfaces/interface";
import { getAxios } from "./axios";

const FirmaUtils = async () => {
  const firmaNetwork = process.env.FIRMACHAIN_NETWORK;
  const firmaConfig: FirmaConfig = (firmaNetwork === 'mainnet') ? FirmaConfig.MainNetConfig : FirmaConfig.TestNetConfig;  
  const firmaSDK = new FirmaSDK(firmaConfig);

  const getAddressList = async () => {
    const addressList = await getAddresses();
    const addressData = await getAddressBalances(addressList);
    addressData.sort((a, b) => {
      return a.amount > b.amount ? 0 : 1;
    });
    return addressData.splice(0, 50);
  }

  const getAddressBalances = async (addressList: string[]) => {
    let addressDatas: ADDRESS_DATA[] = [];
    for (let i = 0; i < addressList.length; i++) {
      if (i % 100 === 0) {
        console.log(i);
      }
      const currentData = addressList[i];
      if (currentData === undefined) continue;

      try {
        const amount = await firmaSDK.Bank.getBalance(currentData);
        const convertBalance = isNaN(Number(amount)) ? 0 : Number(amount);
        
        if (convertBalance < 10) continue;

        addressDatas.push({
          address: currentData,
          amount: Number(amount)
        });
      } catch (e) {
        console.log(currentData);
        console.log(e);
      }
    }
    return addressDatas;
  }

  const getWalletAddressesByKey = async (paginationKey?: string) => {
    const url = getLcdUrl();
    const limit = 1000;
    const path = paginationKey === undefined ? `/cosmos/auth/v1beta1/accounts?pagination.limit=${limit}` : `/cosmos/auth/v1beta1/accounts?pagination.key=${encodeURIComponent(paginationKey)}&pagination.limit=${limit}`;

    try {
      return await getAxios(url, path);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  const collectAddresses = (walletList: []) => {
    let addressList: string[] = [];
    for (let i = 0; i < walletList.length; i++) {
      const currentData: ACCOUNT_DATA = walletList[i];
      addressList.push(currentData.address);
    }

    return addressList;
  }

  const getAddresses = async () => {
    try {
      let walletDatas = await getWalletAddressesByKey();
      if (walletDatas === null) {
        return null;
      }

      let walletList = walletDatas.data.accounts;
      let paginationKey = walletDatas.data.pagination.next_key;
      let addressList: string[] = collectAddresses(walletList);

      while (paginationKey !== null) {
        const nextWalletDatas = await getWalletAddressesByKey(paginationKey);
        if (nextWalletDatas === null) {
          return null;
        }

        const nextWalletList = nextWalletDatas.data.accounts;
        const nextAddressList = collectAddresses(nextWalletList);

        addressList.push(...nextAddressList);
        paginationKey = nextWalletDatas.data.pagination.next_key;
      }

      return addressList;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  const getLcdUrl = () => {
    return (firmaNetwork === 'mainnet') ? "https://lcd-mainnet.firmachain.dev:1317" : "https://lcd-testnet.firmachain.dev:1317";
  }

  return {
    getAddressList
  }
}

export default FirmaUtils;