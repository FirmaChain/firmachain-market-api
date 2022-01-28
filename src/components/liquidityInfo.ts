import * as fs from 'fs';

export function getLiquidityInfo() {
  let _circulatingSupply = fs.readFileSync('./public/liquidityInfo.json', { encoding: 'utf-8' });
  const circulatingSupply = JSON.parse(_circulatingSupply);

  return circulatingSupply;
}