/**
 * Turn TypeDoc JSON into API reference pages that match the Qubee design.
 *
 * Covers what @qubeejs/angular adds and nothing else. The package re-exports
 * the whole of @qubeejs/core, so TypeDoc sees every core symbol too; those
 * are dropped here by source path and linked to from the overview instead —
 * the core docs already document them, once. Every page is generated — never
 * hand-edit `src/content/docs/api/`.
 *
 * MDX, as the core's are: JSDoc prose is full of `{ … }` and `<T>`, so the
 * body goes through escapeMdx() first.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escapeMdx } from './escape-mdx.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const docs = join(here, '..');
const repo = join(docs, '..');
const outDir = join(docs, 'src', 'content', 'docs', 'api');
const jsonPath = join(docs, '.typedoc.json');

const CORE = 'https://qubeejs.andreatantimonaco.me';
const BLOB = 'https://github.com/AndreaAlhena/qubeejs-angular/blob/develop';

/** The three entry points, by the TypeDoc module name of their public-api.ts. */
const ENTRY_POINTS = {
  'http/src/public-api': '@qubeejs/angular/http',
  'router/src/public-api': '@qubeejs/angular/router',
  'src/public-api': '@qubeejs/angular',
};

/** Core classes the adapter extends or wraps, and where the core documents them. */
const CORE_PAGES = {
  Paginator: `${CORE}/api/services/paginator/`,
  QubeeStore: `${CORE}/api/services/qubee-store/`,
  QueryBuilder: `${CORE}/api/services/query-builder/`,
};

const KIND = {
  32: 'const',
  64: 'function',
  128: 'class',
  2097152: 'type',
};

const GROUPS = [
  {
    blurb: 'Configure the driver once, and scope fresh query state where you need it.',
    dir: 'providers',
    label: 'Providers',
    match: (n) =>
      ['QubeeModule', 'buildQubeeProviders', 'createQubeeInstance', 'provideQubee', 'provideQubeeInstance'].includes(
        n.name
      ),
  },
  {
    blurb: 'The injectables: the query builder with its signals, the paginator and the store they share.',
    dir: 'services',
    label: 'Services',
    match: (n) => n.kind === 128 && n.name.startsWith('Qubee'),
  },
  {
    blurb: 'Lists whose state lives in the URL, and the adapters that read and write it.',
    dir: 'lists',
    label: 'Lists',
    match: (n) => n.kind === 64 && /List|Adapter/.test(n.name),
  },
  {
    blurb: 'Fetching a list page with `httpResource()`, from `@qubeejs/angular/http`.',
    dir: 'fetching',
    label: 'Fetching',
    match: (n) => /^qubeeHttpResource/i.test(n.name),
  },
  {
    blurb: 'What `provideQubee()` registers, for when you need to read or replace one.',
    dir: 'tokens',
    label: 'Tokens',
    match: (n) => n.kind === 32,
  },
  { blurb: 'What the adapter throws on its own.', dir: 'errors', label: 'Errors', match: (n) => n.name.endsWith('Error') },
  { blurb: 'The types of the adapter’s own API.', dir: 'types', label: 'Types', match: () => true },
];

/** Every adapter symbol by TypeDoc id, filled before rendering so links resolve. */
const pages = new Map();

/** kebab-case slug: QubeeQueryBuilder → qubee-query-builder, QUBEE_DRIVER → qubee-driver */
const slugify = (name) =>
  name
    .replace(/_/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

/** A fenced block with no language is TypeScript in this codebase. */
const fence = (s) => s.replace(/^```\n/, '```ts\n');

/** Flatten a TypeDoc comment part list into markdown, linking adapter symbols. */
function parts(list = []) {
  return list
    .map((p) => {
      if (p.kind === 'code') return fence(p.text);
      if (p.kind === 'inline-tag') {
        const page = pages.get(p.target);
        return page ? `[\`${p.text}\`](${page.url})` : `\`${p.text}\``;
      }
      return p.text;
    })
    .join('')
    .trim();
}

const text = (comment) => parts(comment?.summary);

/** The opening paragraph of a summary, on one line — for descriptions and lists. */
const lede = (summary) => summary.split(/\n{2,}/)[0].replace(/\s*\n\s*/g, ' ').trim();

/**
 * A symbol's summary. A class documented only through its members — an
 * NgModule with a static `forRoot()` — borrows its first member's.
 */
const summaryOf = (node) => {
  const own = text(node.signatures?.[0]?.comment ?? node.comment);
  const member = (node.children ?? []).find((c) => c.signatures?.[0]?.comment);
  return own || text(member?.signatures[0].comment);
};

/** Every block tag of a given name, as markdown. */
const tags = (comment, name) =>
  (comment?.blockTags ?? []).filter((b) => b.tag === name).map((b) => parts(b.content));

/** Render a TypeDoc type node as readable TypeScript. */
function typeName(t) {
  if (!t) return 'unknown';
  switch (t.type) {
    case 'intrinsic':
    case 'reference':
      return t.typeArguments?.length ? `${t.name}<${t.typeArguments.map(typeName).join(', ')}>` : t.name;
    case 'array': {
      const inner = typeName(t.elementType);
      // A union inside an array needs parentheses or it reads as a union of an array.
      return /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`;
    }
    case 'union':
      // `&` binds tighter than `|`, but `A | (B & C)` reads better bracketed.
      return t.types
        .map((u) => (u.type === 'intersection' ? `(${typeName(u)})` : typeName(u)))
        .join(' | ');
    case 'intersection':
      return t.types.map(typeName).join(' & ');
    case 'literal':
      return typeof t.value === 'string' ? `'${t.value}'` : String(t.value);
    case 'reflection': {
      const sig = t.declaration?.signatures?.[0];
      if (sig) return `(${params(sig)}) => ${typeName(sig.type)}`;
      const children = t.declaration?.children ?? [];
      return children.length
        ? `{ ${children.map((c) => `${c.name}${c.flags?.isOptional ? '?' : ''}: ${typeName(c.type)}`).join('; ')} }`
        : 'object';
    }
    case 'conditional':
      return `${typeName(t.checkType)} extends ${typeName(t.extendsType)} ? ${typeName(t.trueType)} : ${typeName(t.falseType)}`;
    case 'tuple':
      return `[${(t.elements ?? []).map(typeName).join(', ')}]`;
    case 'namedTupleMember':
      return `${t.name}${t.isOptional ? '?' : ''}: ${typeName(t.element)}`;
    case 'typeOperator':
      return `${t.operator} ${typeName(t.target)}`;
    case 'indexedAccess':
      return `${typeName(t.objectType)}[${typeName(t.indexType)}]`;
    case 'query':
      return `typeof ${typeName(t.queryType)}`;
    case 'predicate':
      return `${t.name} is ${typeName(t.targetType)}`;
    case 'templateLiteral':
      return 'template literal';
    default:
      return t.name ?? t.type ?? 'unknown';
  }
}

/** A signature's parameter list as TypeScript. */
const params = (sig) =>
  (sig.parameters ?? [])
    .map((p) => `${p.flags?.isRest ? '...' : ''}${p.name}${p.flags?.isOptional ? '?' : ''}: ${typeName(p.type)}`)
    .join(', ');

/** A signature's type parameter list as TypeScript, or nothing. */
const generics = (sig) =>
  sig.typeParameters?.length
    ? `<${sig.typeParameters.map((t) => (t.type ? `${t.name} extends ${typeName(t.type)}` : t.name)).join(', ')}>`
    : '';

/** Escape a value for use inside a markdown table cell. */
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

/**
 * A description, flattened for a table cell.
 *
 * JSDoc here opens with a title line that has no full stop; joined into one
 * cell it would run into the next paragraph, so each paragraph is closed first.
 */
const prose = (s) =>
  cell(
    String(s)
      .split(/\n{2,}/)
      .map((p) => p.trim().replace(/([^.:!?`])$/, '$1.'))
      .join(' ')
  );

/**
 * The error classes named by `@throws {Name}` above a declaration, in order.
 *
 * TypeDoc consumes `{ErrorClass}` as the tag's type and drops it, leaving the
 * text to start mid-sentence ("If the active driver…"); the JSDoc in the
 * source still has it.
 */
function thrownNames(source) {
  if (!source) return [];
  const lines = readFileSync(join(repo, source.fileName), 'utf8').split('\n');
  const names = [];

  for (let i = source.line - 2; i >= 0 && !lines[i].includes('/**'); i -= 1) {
    const match = lines[i].match(/@throws\s*(?:\{(\w+)\})?/);
    if (match) names.unshift(match[1] ?? null);
  }

  return names;
}

/** "**Throws** `Name` — when…" lines for a signature. */
function throwsLines(sig, source) {
  const names = thrownNames(source);

  return tags(sig.comment, '@throws').map((body, i) => {
    const name = names[i];
    const sentence = body.replace(/\.?$/, '.');
    return name ? `**Throws** \`${name}\` — ${sentence}` : `**Throws** — ${sentence}`;
  });
}

/** Parameter table for a signature, or nothing. */
function paramTable(sig) {
  const list = sig.parameters ?? [];
  if (!list.length) return [];

  return [
    '| Parameter | Type | Description |',
    '| --- | --- | --- |',
    ...list.map(
      (p) =>
        `| \`${p.flags?.isRest ? '...' : ''}${p.name}${p.flags?.isOptional ? '?' : ''}\` | \`${cell(typeName(p.type))}\` | ${prose(text(p.comment)) || '—'} |`
    ),
    '',
  ];
}

/** Usage examples: `@example` and Angular's `@usageNotes`. */
function usage(comment) {
  const blocks = [...tags(comment, '@usageNotes'), ...tags(comment, '@example')].filter(Boolean);
  return blocks.length ? ['## Usage', '', ...blocks.flatMap((b) => [b, ''])] : [];
}

/** Render one method or function signature as a section body. */
function renderSignature(node, sig, { heading, isStatic = false } = {}) {
  const lines = [];

  if (heading) lines.push(`### ${isStatic ? 'static ' : ''}${node.name}()`, '');

  lines.push(
    '```ts',
    `${isStatic ? 'static ' : ''}${node.name}${generics(sig)}(${params(sig)}): ${typeName(sig.type)}`,
    '```',
    ''
  );

  if (heading) {
    const summary = text(sig.comment);
    if (summary) lines.push(summary, '');
  }

  lines.push(...paramTable(sig));

  for (const remark of tags(sig.comment, '@remarks')) lines.push(remark, '');

  const returns = tags(sig.comment, '@returns').find(Boolean);
  if (returns) lines.push(`**Returns** — ${returns}`, '');

  const thrown = throwsLines(sig, node.sources?.[0]);
  if (thrown.length) lines.push(thrown.join('\\\n'), '');

  return lines;
}

/** A property table — class properties or the members of an object type. */
function propertyTable(title, list) {
  if (!list.length) return [];

  return [
    `## ${title}`,
    '',
    '| Member | Type | Description |',
    '| --- | --- | --- |',
    ...list.map((p) => {
      const sig = p.signatures?.[0];
      const type = sig ? `(${params(sig)}) => ${typeName(sig.type)}` : typeName(p.type ?? p.getSignature?.type);
      const name = `${p.name}${p.flags?.isOptional ? '?' : ''}`;
      return `| \`${name}\` | \`${cell(type)}\` | ${prose(text(p.comment ?? sig?.comment ?? p.getSignature?.comment)) || '—'} |`;
    }),
    '',
  ];
}

/** Members declared by the adapter itself — not inherited from the core or from `Error`. */
const own = (list = []) => list.filter((c) => !c.flags?.isPrivate && !c.flags?.isInherited && !c.flags?.isExternal);

/** Render one exported symbol as a full page. */
function renderPage(node) {
  const { entry, group } = pages.get(node.id);
  const kind = KIND[node.kind] ?? 'symbol';
  const source = node.sources?.[0]?.fileName ?? '';
  const children = own(node.children);
  const methods = children.filter((c) => c.kind === 2048);
  const props = children.filter((c) => c.kind === 1024 || c.kind === 262144);
  const signals = props.filter((p) => /^(Writable)?Signal$/.test(p.type?.name ?? ''));
  const sig = node.signatures?.[0];
  const comment = sig?.comment ?? node.comment;

  const count = [
    signals.length ? `${signals.length} signals` : '',
    methods.length ? `${methods.length} public methods` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const badges = [kind, entry, count]
    .filter(Boolean)
    .map((b) => `<span class="qb-chip">${b}</span>`)
    .concat(source ? [`<a class="qb-chip" href="${BLOB}/${source}">${source}</a>`] : [])
    .join('\n');

  const summary = summaryOf(node);
  const label = kind === 'function' ? `${node.name}()` : node.name;

  const front = [
    '---',
    `title: ${JSON.stringify(node.name)}`,
    `description: ${JSON.stringify(lede(summary).replace(/`/g, '') || `${kind} ${node.name}`)}`,
    'sidebar:',
    `  label: ${JSON.stringify(label)}`,
    '  attrs:',
    '    class: qb-api-link',
    '---',
    '',
    '{/* Generated from source JSDoc by scripts/generate-api.mjs — do not edit. */}',
    '',
    '<div class="qb-chips">',
    badges,
    '</div>',
    '',
  ];

  const body = [summary, ''];

  // Classes that extend a core class: name it, and send readers to its page.
  for (const base of node.extendedTypes ?? []) {
    const href = CORE_PAGES[base.name];
    body.push(
      href
        ? `Extends \`${base.name}\` from \`@qubeejs/core\`; the members it inherits are documented in the [core reference ↗](${href}).`
        : `Extends \`${typeName(base)}\`.`,
      ''
    );
  }

  if (node.name === 'QubeeQueryBuilder') {
    body.push(
      `Every mutator delegates to the core \`QueryBuilder\`: what each one emits per driver, and which drivers support it, is in the [core reference ↗](${CORE_PAGES.QueryBuilder}).`,
      ''
    );
  }

  if (sig) {
    body.push('## Signature', '', ...renderSignature(node, sig));
  }

  body.push(...usage(comment));

  if (node.kind === 32) {
    body.push('## Definition', '', '```ts', `const ${node.name}: ${typeName(node.type)}`, '```', '');
  }

  if (node.kind === 2097152) {
    if (node.children?.length) {
      body.push(...propertyTable('Members', own(node.children)));
    } else {
      // An intersection with an object literal reads best as its members.
      const objects = node.type?.type === 'intersection' ? node.type.types.filter((t) => t.declaration?.children) : [];
      const rest = node.type?.type === 'intersection' ? node.type.types.filter((t) => !objects.includes(t)) : [];

      if (objects.length) {
        body.push(...propertyTable('Members', objects.flatMap((t) => t.declaration.children)));
        if (rest.length) body.push(`Intersected with ${rest.map((t) => `\`${typeName(t)}\``).join(', ')}.`, '');
      } else {
        const tp = node.typeParameters?.length ? `<${node.typeParameters.map((t) => t.name).join(', ')}>` : '';
        body.push('## Definition', '', '```ts', `type ${node.name}${tp} = ${typeName(node.type)}`, '```', '');
      }
    }
  }

  if (node.kind === 128) {
    body.push(...propertyTable('Properties', props));

    if (methods.length) {
      body.push('## Methods', '');
      for (const m of [...methods].sort((a, b) => a.name.localeCompare(b.name))) {
        body.push(...renderSignature(m, m.signatures[0], { heading: true, isStatic: m.flags?.isStatic }));
      }
    }
  }

  return front.join('\n') + '\n' + escapeMdx(body.join('\n'));
}

/** The API overview: every adapter symbol by group, and where the rest lives. */
function renderIndex(byGroup) {
  const lines = [
    '---',
    'title: API reference',
    'description: Every symbol @qubeejs/angular adds to @qubeejs/core, generated from the source JSDoc.',
    'sidebar:',
    '  label: Overview',
    '  order: 0',
    '---',
    '',
    '{/* Generated by scripts/generate-api.mjs — do not edit. */}',
    '',
    'Every symbol the Angular adapter adds, generated from its source. Three entry points:',
    '',
    '| Import from | What it holds |',
    '| --- | --- |',
    '| `@qubeejs/angular` | Providers, services, lists, adapters, tokens — and the whole of `@qubeejs/core`, re-exported |',
    '| `@qubeejs/angular/router` | `provideQubeeRouterAdapter()`; the only entry point that needs `@angular/router` |',
    '| `@qubeejs/angular/http` | `qubeeHttpResource()`; built on `httpResource()`, so it needs Angular 19.2 |',
    '',
    ':::note[Not listed here]',
    `\`@qubeejs/angular\` re-exports every driver, enum, error, model, strategy and helper of \`@qubeejs/core\` — \`STRAPI_DRIVER\`, \`SortEnum\`, \`PaginatedCollection\`, \`defineList()\`… Their reference is in the [core API docs ↗](${CORE}/api/services/query-builder/).`,
    ':::',
    '',
  ];

  for (const group of GROUPS) {
    const list = byGroup.get(group.dir);
    if (!list.length) continue;

    lines.push(`## ${group.label}`, '', group.blurb, '');
    for (const node of list) {
      const { url } = pages.get(node.id);
      const name = node.kind === 64 ? `${node.name}()` : node.name;
      lines.push(`- [\`${name}\`](${url}) — ${lede(summaryOf(node)).replace(/\.$/, '')}`);
    }
    lines.push('');
  }

  // Frontmatter and the generated-by comment as written; the rest escaped.
  const body = lines.findIndex((line) => line.startsWith('{/*')) + 1;

  return [...lines.slice(0, body), escapeMdx(lines.slice(body).join('\n'))].join('\n');
}

// ---- run ----------------------------------------------------------------

// Run the docs' TypeDoc bin with this Node rather than through `npx`: on
// Windows `npx` is `npx.cmd`, which execFileSync can only launch through a shell.
execFileSync(
  process.execPath,
  [
    join(docs, 'node_modules', 'typedoc', 'bin', 'typedoc'),
    '--json',
    jsonPath,
    '--entryPoints',
    '../src/public-api.ts',
    '../router/src/public-api.ts',
    '../http/src/public-api.ts',
    '--tsconfig',
    'tsconfig.typedoc.json',
    '--excludeInternal',
    '--excludePrivate',
    '--logLevel',
    'Error',
  ],
  { cwd: docs, stdio: 'inherit' }
);

const project = JSON.parse(readFileSync(jsonPath, 'utf8'));
rmSync(outDir, { force: true, recursive: true });

const byGroup = new Map(GROUPS.map((g) => [g.dir, []]));

for (const module of project.children ?? []) {
  const entry = ENTRY_POINTS[module.name];
  if (!entry) throw new Error(`Unknown entry point ${module.name}`);

  for (const node of module.children ?? []) {
    // The core re-exports: documented by the core, once.
    if (!/^(src|router|http)\//.test(node.sources?.[0]?.fileName ?? '')) continue;

    const group = GROUPS.find((g) => g.match(node));
    pages.set(node.id, { entry, group, url: `/api/${group.dir}/${slugify(node.name)}/` });
    byGroup.get(group.dir).push(node);
  }
}

for (const [dir, list] of byGroup) {
  list.sort((a, b) => a.name.localeCompare(b.name));
  mkdirSync(join(outDir, dir), { recursive: true });
  for (const node of list) {
    writeFileSync(join(outDir, dir, `${slugify(node.name)}.mdx`), renderPage(node));
  }
}

writeFileSync(join(outDir, 'index.mdx'), renderIndex(byGroup));

rmSync(jsonPath, { force: true });
console.log(`  generated ${pages.size} API pages`);
for (const [dir, list] of byGroup) {
  if (list.length) console.log(`    ${dir.padEnd(12)} ${list.length}`);
}
