export const ACCOUNT_BALANCES = {
  query: `
  query AccountBalances {
    account_balance {
      coins
      address
    }
  }`,
  operationName: 'AccountBalances',
  variables: {}
}