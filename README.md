# Market API Server
<center>

![132190694-37c673a7-26fa-4bc9-a71c-2a4a4690d458111111](https://user-images.githubusercontent.com/5277080/132265516-b6373d15-133c-41f3-a093-a93c34155c13.png) 

</center>
The market-api service aims to provide a market data of FirmaChain for the crypto market exchanges. In addition to tracking price, volume and market capitalization, based on-chain metrics.

<br/><br/>

# Service endpoints

| Type        | URL                                                 |
| ----------- | --------------------------------------------------- |
| Mainnet     | https://market-api.firmachain.dev/api/mainnet/info  |
| ERC-20      | https://market-api.firmachain.dev/api/erc20/info    |

<br/>

# How to build and run
### 1. Prepare the project directory and npm.
```
git clone https://github.com/FirmaChain/firmachain-market-api.git
npm install
```
### 2. Run in pm2
```
sudo npm install pm2 -g
npm run build
pm2 start dist/main.js
```

<br/>

# Example of the result (Sample)
```
[
  {
    "symbol": "FCT2",
    "currencyCode": "KRW",
    "marketCap": 49821697467.94547,
    "circulatingSupply": 392358619.21519506,
    "maxSupply": 600283698.025194,
    "provider": "firmachain",
    "lastUpdatedTimestamp": 1643349657460,
    "price": 126.98,
    "accTradePrice24h": 5361149915.25866
  },
  {
    "symbol": "FCT2",
    "currencyCode": "USD",
    "marketCap": 41274949.665580876,
    "circulatingSupply": 392358619.21519506,
    "maxSupply": 600283698.025194,
    "provider": "firmachain",
    "lastUpdatedTimestamp": 1643349657460,
    "price": 0.105197,
    "accTradePrice24h": 4441586.870320769
  },
  {
    "symbol": "FCT2",
    "currencyCode": "IDR",
    ...
  },
  ... (Not an array of all I don't have enough space.)
]
```
