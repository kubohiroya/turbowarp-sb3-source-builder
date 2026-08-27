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
    expect(first.get('sb3-source.json')?.toString()).toContain('embedded-extensions.json');
    expect(first.get('sb3-source.json')?.toString()).toContain('extensions/example3d.js');
  });

  it('rejects malformed public API options before property access', () => {
    expect(() => createTurboWarpSb3AppSourceFiles(undefined as never)).toThrow(
      'options must be an object.'
    );
    expect(() =>
      createTurboWarpSb3AppSourceFiles({agent: '', extension: {id: 'example3d', path: 'extensions/example3d.js', source: ''}})
    ).toThrow('agent must be a non-empty string.');
    expect(() =>
      createTurboWarpSb3AppSourceFiles({agent: 'example-app', extension: undefined as never})
    ).toThrow('extension must be an object.');
    expect(() =>
      createTurboWarpSb3AppSourceFiles({
        agent: 'example-app',
        extension: {id: 1 as never, path: 'extensions/example3d.js', source: ''}
      })
    ).toThrow('extension.id must be an ASCII identifier.');
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
