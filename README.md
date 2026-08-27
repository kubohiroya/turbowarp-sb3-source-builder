# turbowarp-sb3-app-source

[日本語](README.ja.md)

`@kubohiroya/turbowarp-sb3-app-source` builds deterministic source-file maps for TurboWarp SB3 applications.

It is designed to consume extension bundles produced by repositories based on `turbowarp-extension-template` and place them into the `project.source.json` / `embedded-extensions.json` / `sb3-source.json` source layout used by `sb3-toolchain`.

## Scope

- Create minimal Scratch project source objects.
- Create embedded extension descriptors.
- Build deterministic source-file maps with `Buffer` values.
- Keep embedded extension files out of `archiveEntries`; `sb3-toolchain` reads them through `embeddedExtensions` and rebuilds data URLs into `project.json`.
- Keep app-specific runtime code and block behavior outside this package.

## Example

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

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```
