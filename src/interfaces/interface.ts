export class MARKET_DATA {
  symbol: string;
  currencyCode: string;
  price: number;
  marketCap: number;
  accTradePrice24h: number;
  circulatingSupply: number;
  maxSupply: number;
  provider: string;
  lastUpdatedTimestamp: number;
}

export class SUPPLY_DATA {
  circulatingSupply: number;
  maxSupply: number;
  lastUpdatedDate: string;

  constructor() {
    this.circulatingSupply = 0;
    this.maxSupply = 0;
    this.lastUpdatedDate = "";
  }
}

export class LIQUIDITY_DATA {
  erc20: number;
  reserve_value: number;
  maxSupply: number;

  constructor() {
    this.erc20 = 0;
    this.maxSupply = 0;
    this.reserve_value = 0;
  }
}