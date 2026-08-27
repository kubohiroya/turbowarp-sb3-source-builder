# turbowarp-sb3-app-source

[English](README.md)

`@kubohiroya/turbowarp-sb3-app-source` は、TurboWarp SB3 application 用の deterministic な source-file map を作ります。

`turbowarp-extension-template` ベースのリポジトリで生成した extension bundle を受け取り、`sb3-toolchain` が使う `project.source.json` / `embedded-extensions.json` / `sb3-source.json` の source layout に配置するためのパッケージです。

## 役割

- 最小 Scratch project source object を作る。
- embedded extension descriptor を作る。
- `Buffer` value を持つ deterministic な source-file map を作る。
- embedded extension file は `archiveEntries` に入れない。`sb3-toolchain` は `embeddedExtensions` から読み、`project.json` のdata URLとして再構成する。
- app固有のruntime codeやblock behaviorはこのパッケージに入れない。

## 例

```ts
import {createTurboWarpSb3AppSourceFiles} from '@kubohiroya/turbowarp-sb3-app-source';

const files = createTurboWarpSb3AppSourceFiles({
  agent: 'example-app',
  extension: {
    id: 'example3d',
    path: 'extensions/example3d.js',
    source: 'Scratch.extensions.register(...);'
  }
});
```

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```
