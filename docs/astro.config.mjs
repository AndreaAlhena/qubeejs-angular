import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightVersions from 'starlight-versions';

import { LEGACY_API } from './src/legacy-api.mjs';
import { ARCHIVED, CURRENT } from './src/versions.mjs';

const REPO = 'https://github.com/AndreaAlhena/qubeejs-angular';
const SITE = 'https://qubeejs-angular.andreatantimonaco.me';
const CORE = 'https://qubeejs.andreatantimonaco.me';

/** Drivers moved to the core docs in 4.0; their old adapter pages point there. */
const DRIVERS = [
  'api-platform', 'directus', 'drf', 'fastapi', 'feathers', 'json-api', 'json-server', 'laravel', 'nestjs',
  'nestjsx-crud', 'odata', 'payload', 'pocketbase', 'postgrest', 'ransack', 'sieve', 'spatie', 'spring', 'strapi',
  'wordpress',
];

const GUIDE = ['fetching-data', 'getting-started', 'lists', 'pagination', 'per-component-instances', 'query-builder'];

/**
 * The releases Docusaurus served under `/docs/<version>/`. The newest (3.8.0)
 * was served at `/docs/` itself, and the unreleased docs at `/docs/next/`, so
 * `/docs/3.8.0/` never existed. 3.x minors were additive, so every one of
 * these versions maps onto the 3.8 archive.
 */
const LEGACY_VERSIONS = ['3.3.0', '3.4.0', '3.5.0', '3.6.0', '3.7.0'];

/**
 * The TypeDoc API pages under a legacy prefix. Docusaurus generated them from
 * 3.x, so they map to the 3.8 archive's API whatever the prefix, including
 * `/docs/api/`: the 4.0 API shares none of those symbols.
 *
 * @param {string} prefix - `/docs`, `/docs/next` or `/docs/<version>`
 * @returns {Array<[string, string]>} Redirect pairs
 */
const legacyApi = (prefix) => [
  [`${prefix}/api`, '/3.8/api/'],
  ...LEGACY_API.map(([from, to]) => [`${prefix}/api/${from}`, `/3.8/api/${to}/`]),
];

/**
 * Keep the Docusaurus URLs working.
 *
 * - The README and old links point at `/docs/<page>` and `/docs/next/<page>`.
 *   Those served the latest docs, so they go to the current guide, and a
 *   driver page goes to the core's page for that driver.
 * - `/docs/<3.3.0–3.7.0>/…` go to the same page in the 3.8 archive.
 * - The API pages go to the 3.8 archive's API under every prefix, by their
 *   exact old (case-sensitive) names.
 */
const redirects = Object.fromEntries([
  ['/docs', '/guide/getting-started/'],
  ['/drivers', `${CORE}/drivers/`],
  ...DRIVERS.map((d) => [`/drivers/${d}`, `${CORE}/drivers/reference/${d}/`]),
  ...['/docs', '/docs/next'].flatMap((prefix) => [
    ...GUIDE.map((page) => [`${prefix}/${page}`, `/guide/${page}/`]),
    ...DRIVERS.map((d) => [`${prefix}/drivers/${d}`, `${CORE}/drivers/reference/${d}/`]),
  ]),
  ...['/docs', '/docs/next'].flatMap(legacyApi),
  ...LEGACY_VERSIONS.flatMap((version) => {
    const prefix = `/docs/${version}`;

    return [
      [prefix, '/3.8/guide/getting-started/'],
      ...GUIDE.filter((page) => page !== 'lists').map((page) => [`${prefix}/${page}`, `/3.8/guide/${page}/`]),
      ...DRIVERS.filter((d) => d !== 'fastapi' && d !== 'ransack').map((d) => [
        `${prefix}/drivers/${d}`,
        `/3.8/drivers/${d}/`,
      ]),
      ...legacyApi(prefix),
    ];
  }),
  ...ARCHIVED.map((version) => [`/${version.slug}`, `/${version.slug}/guide/getting-started/`]),
]);

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
          label: 'Recipes',
          items: [
            { label: 'Overview', slug: 'recipes' },
            { label: 'Two independent lists on one page', slug: 'recipes/independent-lists' },
            { label: 'One builder per feature service', slug: 'recipes/feature-services' },
            { label: 'A debounced search box', slug: 'recipes/debounced-search' },
            { label: 'Pagination controls', slug: 'recipes/pagination-controls' },
            { label: 'Sortable table headers', slug: 'recipes/sortable-headers' },
            { label: 'A list scoped by a route parameter', slug: 'recipes/route-scoped-list' },
            { label: 'Backends that paginate with headers', slug: 'recipes/header-pagination' },
            { label: 'Testing a list component', slug: 'recipes/testing-lists' },
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
