# Documentation site

The `@qubeejs/angular` docs at [qubeejs-angular.andreatantimonaco.me](https://qubeejs-angular.andreatantimonaco.me), built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build) in the same design family as the [core docs](https://qubeejs.andreatantimonaco.me). Versions come from [starlight-versions](https://github.com/HiDeoo/starlight-versions); internal links are checked on every build by [starlight-links-validator](https://github.com/HiDeoo/starlight-links-validator).

## Setup

TypeDoc reads the library's types from the root `node_modules`, so install the repository first, then the site:

```bash
npm ci            # in the repository root
cd docs
npm ci
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Generates the API pages and the changelog, then starts a dev server with live reload |
| `npm run build` | Generates, then builds the static site into `dist/`. Fails on a broken internal link |
| `npm run preview` | Serves `dist/` |
| `npm run generate` | Only the generators, below |

## What is generated, and what is written

| Path | Source |
| --- | --- |
| `src/content/docs/guide/` | Written by hand: the 4.0 guide |
| `src/content/docs/api/` | **Generated** by `scripts/generate-api.mjs` from the JSDoc of `../src`, `../router` and `../http` (TypeDoc, through `tsconfig.typedoc.json`). Covers the adapter's own exports only — the core re-exports link to the core docs. Gitignored |
| `src/content/docs/changelog.mdx` | **Generated** by `scripts/generate-changelog.mjs` from `../CHANGELOG.md`, which stays the source of truth. Gitignored |
| `src/content/docs/3.8/` | The archived `ng-qubee` 3.8 docs, ported once from Docusaurus. Every page carries an explicit `slug: 3.8/…` (a directory named `3.8` would otherwise slugify to `38`) |
| `src/content/versions/3.8.json` | The 3.8 sidebar |
| `src/versions.mjs` | The version list, read by `astro.config.mjs` and the header |
| `src/pages/index.astro`, `src/pages/404.astro` | The landing and 404 pages, outside Starlight |
| `src/components/` | The Header and PageTitle overrides, and the version menu |
| `src/styles/qubee.css` | The design tokens, unlayered so they beat Starlight's `@layer` rules |

Never hand-edit the generated paths: change the JSDoc or `CHANGELOG.md`, and rebuild.

## Versions

The site root serves the current version (`CURRENT` in `src/versions.mjs`, now 4.0). Each archived version lives under `/<slug>/` (`ARCHIVED`, now only 3.8) with its own sidebar, a search scoped to it, and a notice linking to the current docs. The version menu beside the wordmark sends you to the same page in the other version, else to that version's section index, else to its getting-started page — so switching never lands on a 404.

The 3.x minors 3.3 to 3.7 have no pages of their own: 3.x was additive, so the 3.8 docs cover them.

### Cutting a version

This replaces the Docusaurus step `npx docusaurus docs:version X` that the `chore(release): prepare X` commit used to run. The model is the reverse of Docusaurus: the root always shows the latest release, so what you archive is the **outgoing** version — and its pages have to be snapshotted while `docs/` still describes it.

Archive a version when the next release is about to change its docs — normally with the first docs commit after a release. A release that only adds can skip it, as 3.3 to 3.7 did.

1. In `src/versions.mjs`, add the outgoing version to the front of `ARCHIVED`:

   ```js
   export const ARCHIVED = [
     { label: '4.0', name: '@qubeejs/angular', slug: '4.0' },
     { label: '3.8', name: 'ng-qubee', slug: '3.8' },
   ];
   ```

2. Run `npm run build`. starlight-versions sees the new slug has no directory yet and copies the current pages — the generated API pages included, which freezes that version's API — into `src/content/docs/4.0/`, adding a `slug:` to each and rewriting internal links; it writes the sidebar to `src/content/versions/4.0.json`. `changelog.mdx` and `guide/migrating.md` are excluded from versioning and stay one page for all versions.
   The snapshot parses every page as MDX (the generators escape their output for this) and prefixes every root-relative link with the new version. A link from a current page into an archived version would come out as `/4.0/3.8/…`, so keep such links on an excluded page, as the migration guide does.
3. Commit `src/content/docs/4.0/`, `src/content/versions/4.0.json` and `src/versions.mjs`.
4. In the `chore(release): prepare X` commit, set `CURRENT.label` to the new version.

Already past that point — the next release's edits are on `develop`? Run steps 1 and 2 in a worktree of the outgoing release's tag (`git worktree add ../docs-4.0 v4.0.0`), then copy `src/content/docs/4.0/` and `src/content/versions/4.0.json` back.

## Old URLs

The Docusaurus site served `/docs/<page>`, `/docs/next/<page>` and `/docs/3.8.0/<page>`, and the README still links to some of them. `astro.config.mjs` redirects those to the new pages; the old 4.x driver pages redirect to the core's page for that driver, since drivers are documented there now.

## Deployment

Pushes to `master` that touch `docs/**`, the library source (`src/**`, `router/**`, `http/**`), `CHANGELOG.md` or the workflow itself deploy through `.github/workflows/docs.yml` to GitHub Pages. `public/CNAME` keeps the custom domain.
