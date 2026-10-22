import type { ListLocation } from '@qubeejs/core';

import { toSearchParams } from '@qubeejs/core';

/**
 * Split an href — a path plus query, as `buildListHref()` writes it — into
 * the location a list reads
 *
 * The hash is dropped, as `buildListHref()` drops it.
 *
 * @param href - The href, e.g. `/articles?page=2#top`
 * @returns The path and the query, the query with its leading `?` or empty
 */
export function parseHref(href: string): ListLocation {
  const hash = href.indexOf('#');
  const url = hash < 0 ? href : href.slice(0, hash);
  const query = url.indexOf('?');

  return query < 0
    ? { pathname: url, search: '' }
    : { pathname: url.slice(0, query), search: url.slice(query) };
}

/**
 * Whether two locations name the same path and the same query
 *
 * The `equal` of every adapter's location signal, so a navigation that
 * lands where the list already is notifies nobody.
 *
 * @param a - First location
 * @param b - Second location
 * @returns `true` when the paths match and the queries serialise alike
 */
export function isSameLocation(a: ListLocation, b: ListLocation): boolean {
  return a.pathname === b.pathname
    && toSearchParams(a.search).toString() === toSearchParams(b.search).toString();
}
