/**
 * The documentation versions, in one place.
 *
 * Read by astro.config.mjs (for starlight-versions) and by the header's
 * version menu and archived-page notice. Cutting a version at release time
 * starts with an edit here — see README.md.
 */

/** The version served from the site root. */
export const CURRENT = { label: '4.0', name: '@qubeejs/angular' };

/** Archived versions, newest first, each served under `/<slug>/`. */
export const ARCHIVED = [{ label: '3.8', name: 'ng-qubee', slug: '3.8' }];

/** Where a version starts, relative to its root. */
export const ROOT = 'guide/getting-started';

/**
 * The archived version a docs entry belongs to, or `undefined` for the
 * current one.
 *
 * @param {string} id - A docs collection entry id, such as `3.8/guide/pagination`
 */
export function versionOf(id) {
  const [first] = id.split('/');
  return ARCHIVED.find((version) => version.slug === first);
}

/**
 * Where the same page lives in another version.
 *
 * Tries the same page, then the index of its section (`api`, say), then the
 * version's root — so switching versions never lands on a 404, even for a
 * page that only one version has.
 *
 * @param {string} id - The entry being viewed
 * @param {{ slug?: string } | undefined} target - The version to switch to; `undefined` for the current one
 * @param {Set<string>} ids - Every docs entry id
 * @returns {string} The target path, with leading and trailing slashes
 */
export function counterpart(id, target, ids) {
  const from = versionOf(id);
  const slug = from ? id.slice(from.slug.length + 1) : id;
  const prefix = target?.slug ? `${target.slug}/` : '';
  const hit = [slug, slug.split('/')[0], ROOT].map((s) => prefix + s).find((candidate) => ids.has(candidate));

  return `/${hit ?? prefix + ROOT}/`;
}
