import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightVersions from 'starlight-versions';

import { ARCHIVED, CURRENT } from './src/versions.mjs';

const REPO = 'https://github.com/AndreaAlhena/qubeejs-angular';
const SITE = 'https://qubeejs-angular.andreatantimonaco.me';
const CORE = 'https://qubeejs.andreatantimonaco.me';

/** An archived version's root has no page of its own; it opens that version's guide. */
const redirects = Object.fromEntries(
  ARCHIVED.map((version) => [`/${version.slug}`, `/${version.slug}/guide/getting-started/`])
);

/** A link out to the core docs, marked as such in the sidebar. */
const core = (label, path) => ({ attrs: { rel: 'noopener', target: '_blank' }, label: `${label} ↗`, link: `${CORE}${path}` });

export default defineConfig({
  integrations: [
    starlight({
      components: {
        // Header: the design puts section links and a version menu beside the
        // wordmark, which Starlight's header cannot express.
        Header: './src/components/Header.astro',
        // PageTitle: the breadcrumb above each title, plus the archived-version
        // notice (in place of starlight-versions' own, which links to pages
        // that only one version has).
        PageTitle: './src/components/PageTitle.astro',
        // Not an override: Starlight's own ThemeSelect, named explicitly so
        // starlight-versions does not add its version <select> beside it —
        // the header's version menu replaces it.
        ThemeSelect: '@astrojs/starlight/components/ThemeSelect.astro',
      },
      credits: false,
      customCss: ['./src/styles/qubee.css'],
      // src/pages/404.astro is the design's own 404.
      disable404Route: true,
      description:
        'The Angular adapter for @qubeejs/core: query state as signals, lists in the URL, and httpResource() fetching.',
      editLink: { baseUrl: `${REPO}/edit/develop/docs/` },
      favicon: '/mark.png',
      head: [
        { attrs: { content: `${SITE}/logo.png`, property: 'og:image' }, tag: 'meta' },
        { attrs: { content: 'summary', name: 'twitter:card' }, tag: 'meta' },
      ],
      lastUpdated: true,
      logo: { alt: '@qubeejs/angular', src: './public/mark.png' },
      plugins: [
        starlightVersions({
          current: { label: CURRENT.label },
          // One page for every version, never snapshotted: the changelog is
          // generated from CHANGELOG.md, and the 3.x → 4.0 migration guide is
          // the one page that links into an archived version (a snapshot would
          // prefix that link with its own version).
          exclude: ['changelog.mdx', 'guide/migrating.md'],
          versions: ARCHIVED.map(({ label, slug }) => ({ label, slug })),
        }),
        starlightLinksValidator(),
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Getting started', slug: 'guide/getting-started' },
            { label: 'Migrating from ng-qubee 3.x', slug: 'guide/migrating' },
          ],
        },
        {
          label: 'Guide',
          items: [
            { label: 'The query builder', slug: 'guide/query-builder' },
            { label: 'Pagination', slug: 'guide/pagination' },
            { label: 'Fetching data', slug: 'guide/fetching-data' },
            { label: 'Lists in the URL', slug: 'guide/lists' },
            { label: 'Per-component instances', slug: 'guide/per-component-instances' },
          ],
        },
        {
          label: 'API',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'api' },
            { items: [{ autogenerate: { directory: 'api/providers' } }], label: 'Providers' },
            { items: [{ autogenerate: { directory: 'api/services' } }], label: 'Services' },
            { items: [{ autogenerate: { directory: 'api/lists' } }], label: 'Lists' },
            { items: [{ autogenerate: { directory: 'api/fetching' } }], label: 'Fetching' },
            { items: [{ autogenerate: { directory: 'api/tokens' } }], label: 'Tokens' },
            { items: [{ autogenerate: { directory: 'api/types' } }], label: 'Types' },
            { items: [{ autogenerate: { directory: 'api/errors' } }], label: 'Errors' },
          ],
        },
        {
          label: 'Core docs',
          items: [
            core('Building a query', '/guide/building-a-query/'),
            core('Filters and operators', '/guide/filters/'),
            core('Pagination modes', '/guide/pagination/'),
            core('Lists and URL state', '/guide/lists/'),
            core('Drivers', '/drivers/'),
            core('Errors', '/guide/errors/'),
            core('QueryBuilder API', '/api/services/query-builder/'),
          ],
        },
        { label: 'Changelog', slug: 'changelog' },
      ],
      social: [{ href: REPO, icon: 'github', label: 'GitHub' }],
      title: '@qubeejs/angular',
    }),
  ],
  redirects,
  site: SITE,
});
