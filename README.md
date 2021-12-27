# Typechain Target StarkNet [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

The custom target for [Typechain](https://github.com/ethereum-ts/TypeChain). Generates Factory for StarkNet contracts using ABI. Factory returns a wrapper for `starknet.Contract` that provides:
* typed `call`, and `invoke` methods;
* additional typed `getInvokeFunctionTransaction` method that returns starknet.InvokeFunctionTransaction;
* automatic BN → Uint256 convertion for request parameters, and Uint256 → BN for contract responses.

## Installation

```
npm install --save-dev typechain typechain-target-starknet
```

## How to use it

```
npx typechain --target starknet --out-dir src/generated/contracts **/*.abi.json
```

After calling this command you can get access to all factories from `src/generated/contracts/index.ts`

## Examples

```typescript
import { defaultProvider } from 'starknet';
import { createStarkErc20 } from 'src/generated/contracts';

const erc20Contract = createStarkErc20(defaultProvider, '0x06455b675ad6aa631fe3b7980de789b58d04fc0a5c1647d9807d709b6a72429b');
const anotherContract = createAnotherContract(defaultProvider, '0x0000000000000000000000000000000000000000000000000000000000000000');

erc20Contract.call('balance_of', {
  account: '0x3fac00af50868b94ee4305f21dc43313ec7c06cf68646623535a1652bee6564'
});

erc20Contract.invoke('transfer', {
  recipient: '0x1227dacf5f50c1489510802ca7cc6e0506411604c2aea58443c1b4c8ceab1c2',
  amount: new BN('190000000000000000000'),
});

erc20Contract.getInvokeFunctionTransaction('mint', {
  recipient: '0x3fac00af50868b94ee4305f21dc43313ec7c06cf68646623535a1652bee6564',
  amount: new BN('190000000000000000000'),
});
```
