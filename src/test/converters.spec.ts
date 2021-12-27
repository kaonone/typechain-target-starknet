import BN from 'bn.js';
import { StructAbi } from 'starknet';
import { encodeShortString } from 'starknet/dist/utils/shortString';

import { inputsToCallData, responseToOutput } from 'starknet/converters';
import { extractAbiMethod } from 'starknet/utils';

import testAbi from './abi/testAbi.json';

const structs = testAbi.reduce(
  (acc, curr) => (curr.type === 'struct' ? { ...acc, [curr.name]: curr as StructAbi } : acc),
  {} as Record<string, StructAbi>,
);

describe('inputsToCallData', () => {
  it('should correctly convert BN input to [low, high]', async () => {
    const args = { input_a: new BN('190000000000000000000') };
    const abi = extractAbiMethod(testAbi, 'test_b');
    const result = inputsToCallData(abi.inputs, args, structs);

    expect({ abi, args, result }).toMatchSnapshot();
  });

  it('should correctly convert multiple input values', async () => {
    const args = { input_a: encodeShortString('string'), input_b: new BN('190000000000000000000') };
    const abi = extractAbiMethod(testAbi, 'test_d');
    const result = inputsToCallData(abi.inputs, args, structs);

    expect({ abi, args, result }).toMatchSnapshot();
  });

  it('should correctly convert structures', async () => {
    const args = {
      input_a: {
        member_a: encodeShortString('string'),
        member_b: encodeShortString('string'),
        member_c: new BN('190000000000000000000'),
      },
    };
    const abi = extractAbiMethod(testAbi, 'test_a');
    const result = inputsToCallData(abi.inputs, args, structs);

    expect({ abi, args, result }).toMatchSnapshot();
  });
});

describe('responseToOutput', () => {
  it('should correctly convert [low, high] response to BN', async () => {
    const response = { result: ['0xa4cc799563c380000', '0x0'] };
    const abi = extractAbiMethod(testAbi, 'test_b');
    const result = responseToOutput(abi.outputs, response, structs);

    expect({ abi, response, result }).toMatchSnapshot();
  });

  it('should correctly convert multiple values in response', async () => {
    const response = {
      result: ['0xa4cc799563c380000', '0x0'],
    };
    const abi = extractAbiMethod(testAbi, 'test_d');
    const result = responseToOutput(abi.inputs, response, structs);

    expect({ abi, response, result }).toMatchSnapshot();
  });

  it('should correctly convert structures', async () => {
    const response = {
      result: [
        encodeShortString('string'),
        encodeShortString('string'),
        '0xa4cc799563c380000',
        '0x0',
      ],
    };
    const abi = extractAbiMethod(testAbi, 'test_a');
    const result = responseToOutput(abi.inputs, response, structs);

    expect({ abi, response, result }).toMatchSnapshot();
  });
});
