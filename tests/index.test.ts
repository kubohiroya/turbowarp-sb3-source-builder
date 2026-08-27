import {describe, expect, it} from 'vitest';
import {createTurboWarpSb3AppSourceFiles} from '../src/index.js';

describe('createTurboWarpSb3AppSourceFiles', () => {
  it('creates deterministic SB3 source files for an embedded extension', () => {
    const first = createTurboWarpSb3AppSourceFiles({
      agent: 'example-app',
      extension: {
        id: 'example3d',
        path: 'extensions/example3d.js',
        source: 'Scratch.extensions.register({getInfo(){return {id:"example3d"}}});\n'
      }
    });
    const second = createTurboWarpSb3AppSourceFiles({
      agent: 'example-app',
      extension: {
        id: 'example3d',
        path: 'extensions/example3d.js',
        source: 'Scratch.extensions.register({getInfo(){return {id:"example3d"}}});\n'
      }
    });
    expect([...first.keys()]).toEqual([...second.keys()]);
    expect(first.get('project.source.json')?.toString()).toContain('"example3d"');
    expect(first.get('embedded-extensions.json')?.toString()).toContain('extensions/example3d.js');
  });

  it('rejects unsafe extension paths', () => {
    expect(() =>
      createTurboWarpSb3AppSourceFiles({
        agent: 'example-app',
        extension: {id: 'example3d', path: '../extension.js', source: ''}
      })
    ).toThrow('extension.path must be a safe relative POSIX path.');
  });
});
