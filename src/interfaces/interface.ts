export class UPBIT_DATA {
  symbol: string
  currencyCode: string
  price: number
  marketCap: number
  accTradePrice24h: number
  circulatingSupply: number
  maxSupply: number
  provider: string
  lastUpdatedTimestamp: number
}

export class ACCOUNT_DATA {
  address: string;
  account_number: string;
  sequence: string;
}

export class ADDRESS_DATA {
  address: string;
  amount: number;
}