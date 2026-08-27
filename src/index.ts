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

function bytes(value: string | Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

function jsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function md5(contents: Buffer): string {
  return createHash('md5').update(contents).digest('hex');
}

function assertIdentifier(value: string, name: string): string {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(value)) {
    throw new TypeError(`${name} must be an ASCII identifier.`);
  }
  return value;
}

function assertPath(value: string, name: string): string {
  if (
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

function defaultBackdrop(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#101820"/>
</svg>
`);
}

export function createTurboWarpSb3AppSourceFiles(
  options: TurboWarpSb3AppSourceOptions
): Map<string, Buffer> {
  const extensionId = assertIdentifier(options.extension.id, 'extension.id');
  const extensionPath = assertPath(options.extension.path, 'extension.path');
  const extensionBytes = bytes(options.extension.source);
  const backdropBytes = bytes(options.stageBackdrop?.svg ?? defaultBackdrop());
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
            name: options.stageBackdrop?.name ?? 'Title',
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
        mediaType: options.extension.mediaType ?? 'text/javascript',
        parameters: [...(options.extension.parameters ?? [])],
        encoding: options.extension.encoding ?? 'base64'
      }
    ]
  };

  const sourceManifest = {
    formatVersion: 1,
    project: 'project.source.json',
    embeddedExtensions: 'embedded-extensions.json',
    assetsDirectory: 'assets',
    archiveEntries: ['project.json', backdropFilename]
  };

  return new Map([
    ['project.source.json', jsonBytes(project)],
    ['embedded-extensions.json', jsonBytes(embeddedExtensions)],
    ['sb3-source.json', jsonBytes(sourceManifest)],
    [`assets/${backdropFilename}`, backdropBytes],
    [extensionPath, extensionBytes]
  ]);
}
