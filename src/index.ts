/* eslint-disable import/no-default-export */
import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { Config, TypeChainTarget, Output, FileDescription } from 'typechain';

import { transform } from './transform';
import { getFilesParams } from './transform/utils';

const DEFAULT_OUT_PATH = './generated/';

export default class Starknet extends TypeChainTarget {
  name = 'Starknet';

  private readonly outDirAbs: string;

  private readonly creatorNames: string[] = [];

  constructor(ctx: Config) {
    super(ctx);

    const { cwd, outDir } = ctx;

    this.outDirAbs = resolve(cwd, outDir || DEFAULT_OUT_PATH);
  }

  transformFile(file: FileDescription): Output | Promise<Output> {
    const { contents, path } = file;
    const abi = JSON.parse(contents);
    if (!Array.isArray(abi) || abi.length === 0) {
      return;
    }
    const { creatorName, abiPath } = getFilesParams(path);
    this.creatorNames.push(creatorName);

    return [
      {
        path: join(this.outDirAbs, `${creatorName}.ts`),
        contents: transform(abi as any, path),
      },
      {
        path: join(this.outDirAbs, `${abiPath}.ts`),
        contents: `export default ${contents}`,
      },
    ];
  }

  afterRun() {
    const walkSync = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true, encoding: 'utf-8' }).reduce((acc, curr) => {
        const absolute = join(dir, curr.name);
        const files = curr.isDirectory() ? walkSync(absolute) : [absolute];
        return acc.concat(files);
      }, [] as string[]);

    const starknetPath = join(__dirname, '../src/starknet/');

    return [
      {
        path: join(this.outDirAbs, 'index.ts'),
        contents: this.creatorNames.map(name => `export * from './${name}'`).join('\n'),
      },
      ...walkSync(starknetPath).map(file => ({
        path: join(this.outDirAbs, 'utils', relative(starknetPath, file)),
        contents: readFileSync(file, 'utf-8'),
      })),
    ];
  }
}
