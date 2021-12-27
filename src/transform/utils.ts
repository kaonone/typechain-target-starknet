import { getFilename, getUsedIdentifiers } from 'typechain';

export function getFilesParams(path: string) {
  const fullName = getFilename(path);
  const shortName = fullName.split('.')[0];
  const ShortName = `${shortName.slice(0, 1).toUpperCase()}${shortName.slice(1)}`;

  return {
    shortName,
    creatorName: `createStark${ShortName}`,
    contractType: `Stark${ShortName}Contract`,
    abiPath: `./abi/${fullName}`,
  };
}

type ModuleSpecifier = string;
type Name = string;
type IsDefault = true;
type Identifier = [Name, IsDefault] | Name;

export function createUsedImports(
  possibleImports: Record<ModuleSpecifier, Identifier[]>,
  sourceFile: string,
) {
  return Object.entries(possibleImports)
    .map(([moduleSpecifier, identifiers]) => {
      const usedIdentifiers = getUsedIdentifiers(
        identifiers.map(x => getIdentifierName(x)),
        sourceFile,
      );
      return createImportDeclaration(
        identifiers.filter(x => usedIdentifiers.includes(getIdentifierName(x))),
        moduleSpecifier,
      );
    })
    .filter(x => x)
    .join('\n');
}

function createImportDeclaration(identifiers: Identifier[], moduleSpecifier: string) {
  const [defaultImport] = identifiers.find(x => typeof x !== 'string') || [];
  const restIdentifiers = identifiers.filter(x => typeof x === 'string');

  const namedImports = restIdentifiers.length > 0 ? `{ ${restIdentifiers.join(', ')} }` : '';
  const allImports = [defaultImport, namedImports].filter(x => !!x).join(', ');
  return allImports.length ? `import ${allImports} from '${moduleSpecifier}'` : '';
}

function getIdentifierName(identifier: Identifier) {
  return typeof identifier === 'string' ? identifier : identifier[0];
}
