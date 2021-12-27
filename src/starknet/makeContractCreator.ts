/* eslint-disable import/no-extraneous-dependencies */
import { Contract, Provider, stark } from 'starknet';

import { inputsToCallData, responseToOutput } from './converters';
import {
  CallFunction,
  ContractWrapper,
  EnvArgs,
  GetInvokeFunctionTransaction,
  InvokeFunction,
} from './types';
import { extractAbiMethod } from './utils';

export function makeContractCreator<T extends ContractWrapper>(abi: any[]) {
  return (address: string, provider: Provider): T => {
    const baseContract = new Contract(abi, address, provider);

    return (new Proxy<Contract>(baseContract, {
      get(target, prop: keyof ContractWrapper) {
        if (prop === 'call') {
          return makeCallFunction(baseContract, address);
        }
        if (prop === 'invoke') {
          return makeInvokeFunction(baseContract, address);
        }
        if (prop === 'getInvokeFunctionTransaction') {
          return makeGetInvokeFunctionTransaction(baseContract, address);
        }
        return target[prop];
      },
    }) as unknown) as T;
  };
}

function makeCallFunction(baseContract: Contract, contractAddress: string): CallFunction {
  return async (method: string, inputs?: EnvArgs) => {
    const methodAbi = extractAbiMethod(baseContract.abi, method);
    const requestInputs = inputs
      ? inputsToCallData(methodAbi.inputs, inputs, baseContract.structs)
      : [];

    const result = await baseContract.provider.callContract({
      contract_address: contractAddress,
      entry_point_selector: stark.getSelectorFromName(method),
      calldata: requestInputs,
    });
    const responseOutputs = responseToOutput(methodAbi.outputs, result, baseContract.structs);

    return responseOutputs;
  };
}

function makeInvokeFunction(baseContract: Contract, contractAddress: string): InvokeFunction {
  return (method: string, inputs?: EnvArgs) => {
    const methodAbi = extractAbiMethod(baseContract.abi, method);
    const requestInputs = inputs
      ? inputsToCallData(methodAbi.inputs, inputs, baseContract.structs)
      : [];

    return baseContract.provider.invokeFunction(
      contractAddress,
      stark.getSelectorFromName(method),
      requestInputs,
    );
  };
}

function makeGetInvokeFunctionTransaction(
  baseContract: Contract,
  contractAddress: string,
): GetInvokeFunctionTransaction {
  return (method: string, inputs?: EnvArgs) => {
    const methodAbi = extractAbiMethod(baseContract.abi, method);
    const requestInputs = inputs
      ? inputsToCallData(methodAbi.inputs, inputs, baseContract.structs)
      : [];

    return {
      type: 'INVOKE_FUNCTION',
      contract_address: contractAddress,
      entry_point_selector: stark.getSelectorFromName(method),
      calldata: requestInputs,
    };
  };
}
