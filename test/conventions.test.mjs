/*
 * Repository conventions — the structural half of @qubeejs/core's
 * CODING-STANDARDS.md that ESLint cannot express.
 *
 * Ported from the core's test/conventions.spec.ts. It runs on node:test rather
 * than Karma because Karma runs specs in a browser, where the file system
 * these checks read does not exist.
 */
import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const DECL =
  /^(export\s+)?(?:declare\s+)?(abstract class|class|interface|type|enum|const|function)\s+(\w+)/gm;

/** The three entry points of the package: the main one, `/router` and `/http`. */
const ENTRY_DIRS = ['src', 'router', 'http'];

const read = (dir) =>
  globSync('**/*.ts', { cwd: join(rootDir, dir) }).map((p) => {
    const text = readFileSync(join(rootDir, dir, p), 'utf8');
    const declarations = [...text.matchAll(DECL)].map((m) => ({
      exported: Boolean(m[1]),
      kind: m[2].replace('abstract class', 'class'),
      name: m[3],
    }));
    return { declarations, name: p.split('/').pop(), path: `${dir}/${p}`, text };
  });

/** Every TypeScript file in the package, specs included. */
const allFiles = ENTRY_DIRS.flatMap(read);

/** The shipped library: no specs, no Karma bootstrap. */
const files = allFiles.filter((f) => !f.name.endsWith('.spec.ts') && f.path !== 'src/test.ts');

const exportedOf = (f) => f.declarations.filter((d) => d.exported);

describe('repository conventions', () => {
  it('has source files to check', () => {
    assert.ok(files.length > 15);
  });

  it('never mixes declaration kinds in one file', () => {
    const offenders = files
      .filter((f) => new Set(exportedOf(f).map((d) => d.kind)).size > 1)
      .map(
        (f) =>
          `${f.path} exports ${[...new Set(exportedOf(f).map((d) => d.kind))].sort().join(' + ')}`
      );
    assert.deepEqual(offenders, []);
  });

  it('declares interfaces only in *.interface.ts', () => {
    const offenders = files
      .filter(
        (f) =>
          f.declarations.some((d) => d.kind === 'interface') && !f.name.endsWith('.interface.ts')
      )
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it('exports types only from *.type.ts', () => {
    // File-local (non-exported) helper types may live beside their only consumer.
    const offenders = allFiles
      .filter((f) => exportedOf(f).some((d) => d.kind === 'type') && !f.name.endsWith('.type.ts'))
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it('reserves the I prefix for interfaces a class implements', () => {
    const all = files.map((f) => f.text).join('\n');
    const offenders = files
      .flatMap((f) => f.declarations.map((d) => ({ ...d, path: f.path })))
      .filter((d) => d.kind === 'interface' || d.kind === 'type')
      .filter((d) => /^I[A-Z]/.test(d.name))
      .filter((d) => !new RegExp(`implements\\s+${d.name}\\b`).test(all))
      .map((d) => `${d.path}: ${d.name} is I-prefixed but no class implements it`);
    assert.deepEqual(offenders, []);
  });

  it('names enums *Enum and puts them in *.enum.ts', () => {
    const offenders = files
      .flatMap((f) =>
        f.declarations.filter((d) => d.kind === 'enum').map((d) => ({ ...d, path: f.path }))
      )
      .filter((d) => !d.name.endsWith('Enum') || !d.path.endsWith('.enum.ts'))
      .map((d) => `${d.path}: ${d.name}`);
    assert.deepEqual(offenders, []);
  });

  it('uses kebab-case filenames', () => {
    const offenders = allFiles
      .filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z-]+)*\.ts$/.test(f.name))
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it('imports nothing from node:', () => {
    // The adapter runs in the browser and on the server alike.
    const offenders = files.filter((f) => /from 'node:/.test(f.text)).map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it('never imports RxJS', () => {
    // 4.0 removed RxJS from the adapter; signals are the only reactive primitive.
    const offenders = files.filter((f) => /from 'rxjs/.test(f.text)).map((f) => f.path);
    assert.deepEqual(offenders, []);
  });

  it('uses UPPER_CASE only for literal constants', () => {
    // UPPER_CASE means a static, literal value. Anything computed at runtime is
    // camelCase — with one Angular exception: an `InjectionToken` is a DI key,
    // and Angular's own convention (`DOCUMENT`, `APP_INITIALIZER`) names keys
    // in UPPER_CASE whatever produced them.
    const declaration = /^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=\s*(.*)$/gm;
    const literal = /^[{['"`/]|^-?\d|^true\b|^false\b|^null\b|^new InjectionToken\b/;
    const offenders = allFiles.flatMap((f) =>
      [...f.text.matchAll(declaration)]
        .filter((m) => !literal.test(m[2].trim()))
        .map((m) => `${f.path}: ${m[1]} is computed at runtime — use camelCase`)
    );
    assert.deepEqual(offenders, []);
  });

  it('performs no network I/O outside HttpClient', () => {
    const offenders = files
      .filter((f) =>
        /\b(fetch|XMLHttpRequest|axios)\s*\(/.test(f.text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''))
      )
      .map((f) => f.path);
    assert.deepEqual(offenders, []);
  });
});
