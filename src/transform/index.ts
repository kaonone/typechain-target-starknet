/* eslint-disable import/no-extraneous-dependencies */
import { Abi, AbiEntry, FunctionAbi, StructAbi } from 'starknet';

import { AbiType, isAbiType } from './types';
import { createUsedImports, getFilesParams } from './utils';

export function transform(abi: Abi[], path: string) {
  const { shortName, creatorName, contractType, abiPath } = getFilesParams(path);
  const callMethods = abi.filter(
    (m): m is FunctionAbi => m.type === 'function' && m.stateMutability === 'view',
  );
  const invokeMethods = abi.filter(
    (m): m is FunctionAbi => m.type === 'function' && m.stateMutability !== 'view',
  );
  const structs = abi.filter((s): s is StructAbi => s.type === 'struct' && !isAbiType(s.name));

  const template = `
  import ${shortName} from '${abiPath}';
  
  export const ${creatorName} = makeContractCreator<${contractType}>(
    ${shortName} as any[]
  );

  export interface ${contractType} extends ContractWrapper {
    call: CallMethods;
    invoke: InvokeMethods;
    getInvokeFunctionTransaction: GetInvokeFunctionTransaction;
  }

  interface CallMethods {
    ${codegenMethods(callMethods, structs, outputs =>
      outputs.length > 0 ? `Promise<${outputs}>` : 'void',
    )}
  }

  interface InvokeMethods {
    ${codegenMethods(invokeMethods, structs, () => 'Promise<AddTransactionResponse>')}
  }

  interface GetInvokeFunctionTransaction {
    ${codegenMethods(invokeMethods, structs, () => 'InvokeFunctionTransaction')}
  }

  ${codegenStructs(structs)}
  `;

  const imports = createUsedImports(
    {
      'bn.js': [['BN', true]],
      starknet: ['AddTransactionResponse', 'InvokeFunctionTransaction'],
      './utils/types': ['ContractWrapper'],
      './utils/makeContractCreator': ['makeContractCreator'],
    },
    template,
  );

  return imports + template;
}

function codegenMethods(
  methods: FunctionAbi[],
  structs: StructAbi[],
  outputsConverter: (outputs: string) => string = outputs => outputs,
): string {
  return methods
    .map(m => {
      const inputs = m.inputs.length > 0 ? codegenObjectType(m.inputs, structs) : null;
      const outputs = outputsConverter(codegenObjectType(m.outputs, structs));

      return inputs
        ? `(method: '${m.name}', args: ${inputs}): ${outputs};`
        : `(method: '${m.name}'): ${outputs};`;
    })
    .join('\n');
}

function codegenStructs(structs: StructAbi[]) {
  return structs
    .map(({ name, members }) => `interface ${name} ${codegenObjectType(members, structs)}`)
    .join('\n\n');
}

function codegenObjectType(abiEntries: AbiEntry[], structs: StructAbi[]): string {
  return `{
    ${abiEntries
      .map(
        ({ name, type }) =>
          `${name}: ${isAbiType(type) ? codegenType(type) : codegenStructType(type, structs)}`,
      )
      .join(';')}
  }`;
}

function codegenType(type: AbiType): string {
  switch (type) {
    case 'Uint256':
      return 'BN';
    case 'felt':
      return 'string';
  }
}

function codegenStructType(type: string, structs: StructAbi[]): string {
  if (!structs.some(s => s.name === type)) {
    throw new Error(`Unhandled type while code generation: ${type}`);
  }
  return type;
}
