import { Contract, AbiEntry, uint256, CallContractResponse, number } from 'starknet';

import {
  EnvArgs,
  isAbiType,
  StarknetCallData,
  AbiType,
  isPlainValue,
  AbiToInputJSTypeMap,
  AbiToStarknetResponseTypeMap,
} from './types';

export function inputsToCallData(
  inputsAbi: AbiEntry[],
  args: EnvArgs,
  structs: Contract['structs'],
): StarknetCallData {
  return inputsAbi.flatMap(({ name, type }) => {
    const arg = args[name];
    if (!arg) {
      throw new Error(`ABI parameter ${name} not found in ${args}`);
    }
    const struct = structs[type];
    if (!struct && !isAbiType(type)) {
      throw new Error(`Unknown abi type ${type}`);
    }
    return isAbiType(type)
      ? convertToCallData(arg, type)
      : inputsToCallData(struct.members, arg as any, structs);
  });
}

export function responseToOutput(
  outputsAbi: AbiEntry[],
  response: CallContractResponse,
  structs: Contract['structs'],
): EnvArgs {
  const { result } = outputsAbi.reduce(
    (acc, { name, type }) => {
      const struct = structs[type];
      const chunkLength = struct ? struct.members.length : 1;
      const nextLastArgIndex = acc.lastArgIndex + chunkLength;

      const arg = response.result.slice(acc.lastArgIndex, nextLastArgIndex);

      if (!arg?.length) {
        throw new Error(`ABI parameter ${name} not found in ${response}`);
      }
      if (!struct && !isAbiType(type)) {
        throw new Error(`Unknown abi type ${type}`);
      }

      return {
        lastArgIndex: nextLastArgIndex,
        result: {
          ...acc.result,
          [name]: isAbiType(type)
            ? convertToResponseValue(arg, type)
            : responseToOutput(struct.members, { result: arg }, structs),
        },
      };
    },
    { lastArgIndex: 0 } as { lastArgIndex: number; result: EnvArgs },
  );
  return result;
}

function convertToResponseValue(value: string | string[], abiType: AbiType): EnvArgs[string] {
  const toResponse: {
    [key in AbiType]: (v: AbiToStarknetResponseTypeMap[key]) => EnvArgs[string];
  } = {
    felt: v => v[0],
    Uint256: v => {
      const [low, high] = v;
      return uint256.uint256ToBN({ low, high });
    },
  };

  return (toResponse[abiType] as any)(value);
}

function convertToCallData(value: EnvArgs[string], abiType: AbiType): StarknetCallData {
  if (!isPlainValue(value)) {
    throw new Error(`Expected string, or BN, but received ${value}`);
  }
  const toInvokeCalldata: {
    [key in AbiType]: (input: AbiToInputJSTypeMap[key]) => StarknetCallData;
  } = {
    felt: v => {
      return [number.toBN(v).toString()];
    },
    Uint256: v => {
      const { low, high } = uint256.bnToUint256(v);
      return [number.toBN(low).toString(), number.toBN(high).toString()];
    },
  };
  return (toInvokeCalldata[abiType] as any)(value);
}
