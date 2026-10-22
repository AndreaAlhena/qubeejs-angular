import type { Signal } from '@angular/core';
import type { ListLocation } from '@qubeejs/core';

/**
 * How a list asks its adapter to navigate
 */
export type QubeeListNavigateOptions = {
  /**
   * Replace the current history entry instead of pushing a new one
   */
  replace: boolean;
};

/**
 * Where a list reads its URL from and how it writes one back
 *
 * `injectQubeeList()` names no router: it reads `location` and calls
 * `navigate()`, and the adapter decides what those mean. Three ship with the
 * package — `provideQubeeRouterAdapter()` from `@qubeejs/angular/router` for
 * the Angular Router, `provideQubeeBrowserAdapter()` for the History API
 * without a router, and `provideQubeeMemoryAdapter()` for state kept out of
 * the address bar. For anything else, provide an object of this shape under
 * `QUBEE_LIST_ADAPTER`.
 */
export type QubeeListAdapter = {
  /**
   * The current path and query, updated after every navigation — the list's,
   * the user's Back and Forward, a link elsewhere
   */
  readonly location: Signal<ListLocation>;

  /**
   * Navigate to `href`, a path plus query as `buildListHref()` writes it
   *
   * May return a promise that settles once the navigation is over, as the
   * Angular Router's `navigateByUrl()` does; the list reports `isPending`
   * until then.
   */
  navigate(href: string, options: QubeeListNavigateOptions): unknown;
};
