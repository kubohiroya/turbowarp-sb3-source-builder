import {createHash} from 'node:crypto';

export interface EmbeddedExtensionSource {
  id: string;
  path: string;
  source: string | Buffer | Uint8Array;
  mediaType?: string;
  parameters?: readonly string[];
  encoding?: 'base64';
}

export interface StageBackdropSource {
  name?: string;
  svg: string | Buffer | Uint8Array;
}

export interface TurboWarpSb3AppSourceOptions {
  agent: string;
  extension: EmbeddedExtensionSource;
  stageBackdrop?: StageBackdropSource;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bytes(value: string | Buffer | Uint8Array): Buffer {
  if (typeof value !== 'string' && !Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new TypeError('source bytes must be a string, Buffer, or Uint8Array.');
  }
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

function jsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function md5(contents: Buffer): string {
  return createHash('md5').update(contents).digest('hex');
}

function assertIdentifier(value: unknown, name: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/u.test(value)) {
    throw new TypeError(`${name} must be an ASCII identifier.`);
  }
  return value;
}

function assertPath(value: unknown, name: string): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('\0') ||
    value.includes('\\') ||
    value.startsWith('/') ||
    value.split('/').some((part) => part.length === 0 || part === '.' || part === '..')
  ) {
    throw new TypeError(`${name} must be a safe relative POSIX path.`);
  }
  return value;
}

function assertNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}

function validateOptionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string when provided.`);
  }
  return value;
}

function validateParameters(value: unknown): readonly string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new TypeError('extension.parameters must be a string array when provided.');
  }
  return value;
}

function defaultBackdrop(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#101820"/>
</svg>
`);
}

export function createTurboWarpSb3AppSourceFiles(
  options: TurboWarpSb3AppSourceOptions
): Map<string, Buffer> {
  if (!isRecord(options)) throw new TypeError('options must be an object.');
  const agent = assertNonEmptyString(options.agent, 'agent');
  if (!isRecord(options.extension)) throw new TypeError('extension must be an object.');
  if (options.stageBackdrop !== undefined && !isRecord(options.stageBackdrop)) {
    throw new TypeError('stageBackdrop must be an object when provided.');
  }
  const extensionId = assertIdentifier(options.extension.id, 'extension.id');
  const extensionPath = assertPath(options.extension.path, 'extension.path');
  const extensionBytes = bytes(options.extension.source as string | Buffer | Uint8Array);
  const backdropBytes = bytes(
    (options.stageBackdrop?.svg as string | Buffer | Uint8Array | undefined) ?? defaultBackdrop()
  );
  const backdropName = validateOptionalString(options.stageBackdrop?.name, 'stageBackdrop.name') ?? 'Title';
  const mediaType = validateOptionalString(options.extension.mediaType, 'extension.mediaType') ?? 'text/javascript';
  const parameters = validateParameters(options.extension.parameters);
  const encoding = options.extension.encoding ?? 'base64';
  if (encoding !== 'base64') throw new TypeError('extension.encoding must be base64 when provided.');
  const backdropAssetId = md5(backdropBytes);
  const backdropFilename = `${backdropAssetId}.svg`;

  const project = {
    targets: [
      {
        isStage: true,
        name: 'Stage',
        variables: {},
        lists: {},
        broadcasts: {},
        blocks: {},
        comments: {},
        currentCostume: 0,
        costumes: [
          {
            assetId: backdropAssetId,
            name: backdropName,
            bitmapResolution: 1,
            dataFormat: 'svg',
            md5ext: backdropFilename,
            rotationCenterX: 240,
            rotationCenterY: 180
          }
        ],
        sounds: [],
        volume: 100,
        layerOrder: 0,
        tempo: 60,
        videoTransparency: 50,
        videoState: 'on',
        textToSpeechLanguage: null
      }
    ],
    extensionURLs: {
      [extensionId]: `embedded-extension:${extensionPath}`
    },
    meta: {
      semver: '3.0.0',
      vm: '0.2.0',
      agent: options.agent
    }
  };

  const embeddedExtensions = {
    formatVersion: 1,
    extensions: [
      {
        id: extensionId,
        path: extensionPath,
        mediaType,
        parameters: [...parameters],
        encoding
      }
    ]
  };

  const sourceManifest = {
    formatVersion: 1,
    project: 'project.source.json',
    embeddedExtensions: 'embedded-extensions.json',
    assetsDirectory: 'assets',
    archiveEntries: ['project.json', backdropFilename, 'embedded-extensions.json', extensionPath]
  };

  return new Map([
    ['project.source.json', jsonBytes(project)],
    ['embedded-extensions.json', jsonBytes(embeddedExtensions)],
    ['sb3-source.json', jsonBytes(sourceManifest)],
    [`assets/${backdropFilename}`, backdropBytes],
    [extensionPath, extensionBytes]
  ]);
}
