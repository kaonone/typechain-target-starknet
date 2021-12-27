import { AbiEntry, FunctionAbi } from 'starknet';

export function extractAbiMethod(abi: AbiEntry[], method: string) {
  const methodEntry = abi.find((m): m is FunctionAbi => m.name === method && m.type === 'function');
  if (!methodEntry) {
    throw new Error(`Method ${method} not found`);
  }
  return methodEntry;
}
