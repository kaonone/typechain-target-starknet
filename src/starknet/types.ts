import BN, { isBN } from 'bn.js';
import { AddTransactionResponse, Contract, InvokeFunctionTransaction } from 'starknet';

export interface ContractWrapper extends Omit<Contract, 'call' | 'invoke'> {
  call: (...args: any[]) => any;
  invoke: (...args: any[]) => any;
  getInvokeFunctionTransaction: (...args: any[]) => any;
}

type JSType = string | BN;
export function isPlainValue<T>(value: T): value is Extract<T, JSType> {
  return typeof value === 'string' || isBN(value);
}

const abiTypes = ['felt', 'Uint256'] as const;
export type AbiType = typeof abiTypes[number];
export function isAbiType(value: unknown): value is AbiType {
  return abiTypes.includes(value as any);
}

type AbiTypeMap<K, T extends Record<AbiType, K>> = Pick<T, AbiType>;
export type AbiToInputJSTypeMap = AbiTypeMap<
  JSType,
  {
    felt: string;
    Uint256: BN;
  }
>;

export type AbiToStarknetResponseTypeMap = AbiTypeMap<
  string[],
  {
    felt: [string];
    Uint256: [string, string];
  }
>;

export type EnvArgs = { [key in string]: JSType | EnvArgs };

export type CallFunction = (method: string, args?: EnvArgs) => Promise<EnvArgs | void>;
export type InvokeFunction = (method: string, args?: EnvArgs) => Promise<AddTransactionResponse>;
export type GetInvokeFunctionTransaction = (
  method: string,
  args?: EnvArgs,
) => InvokeFunctionTransaction;

export type StarknetCallData = string[];
