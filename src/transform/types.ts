const abiTypes = ['Uint256', 'felt'] as const;
export type AbiType = typeof abiTypes[number];
export function isAbiType(value: unknown): value is AbiType {
  return abiTypes.includes(value as any);
}
