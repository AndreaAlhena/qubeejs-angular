import { DestroyRef, Provider, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, ResolveEnd, Router } from '@angular/router';
import { QUBEE_LIST_ADAPTER, toSearchParams } from '@qubeejs/angular';

import type { ListLocation, QubeeListAdapter, QubeeListNavigateOptions } from '@qubeejs/angular';

/**
 * Provide an adapter that reads and writes the URL through the Angular Router
 *
 * Lists navigate with `router.navigateByUrl()` and follow every navigation,
 * theirs or not — Back, Forward, a `routerLink` elsewhere. Provide it once,
 * next to `provideRouter()`:
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideRouter(routes), provideQubeeRouterAdapter()]
 * });
 * ```
 *
 * A list's location moves to the incoming URL as soon as the router has
 * resolved it, before the routed components are created, so a list injected
 * in one of them starts from the URL it was navigated to. A navigation that
 * is cancelled or fails moves it back.
 *
 * Render links to list states with `routerLink`; a plain `[href]` reloads
 * the page. From Angular 18.1 it takes a `UrlTree` —
 * `[routerLink]="router.parseUrl(list.href({ page: 2 }))"`; before, pass the
 * query on its own — `[routerLink]="[]"` with
 * `[queryParams]="router.parseUrl(list.href({ page: 2 })).queryParams"`.
 *
 * @returns The provider for `QUBEE_LIST_ADAPTER`
 */
export function provideQubeeRouterAdapter(): Provider[] {
  return [{ provide: QUBEE_LIST_ADAPTER, useFactory: createRouterAdapter }];
}

/**
 * Build the Router adapter in the current injection context
 *
 * @returns The adapter
 */
function createRouterAdapter(): QubeeListAdapter {
  const router = inject(Router);
  const location = signal<ListLocation>(parseUrl(router.url), { equal: isSameLocation });
  const subscription = router.events.subscribe((event) => {
    if (event instanceof ResolveEnd) {
      location.set(parseUrl(event.urlAfterRedirects));
    } else if (
      event instanceof NavigationEnd
      || event instanceof NavigationCancel
      || event instanceof NavigationError
      || event instanceof NavigationSkipped
    ) {
      location.set(parseUrl(router.url));
    }
  });

  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());

  return {
    location: location.asReadonly(),
    navigate: (href: string, { replace }: QubeeListNavigateOptions): Promise<boolean> =>
      router.navigateByUrl(href, { replaceUrl: replace })
  };
}

/**
 * Split a router URL into a path and a query, dropping the fragment
 *
 * @param url - A URL as `router.url` serialises it
 * @returns The location a list reads
 */
function parseUrl(url: string): ListLocation {
  const hash = url.indexOf('#');
  const path = hash < 0 ? url : url.slice(0, hash);
  const query = path.indexOf('?');

  return query < 0
    ? { pathname: path, search: '' }
    : { pathname: path.slice(0, query), search: path.slice(query) };
}

/**
 * Whether two locations name the same path and the same query
 *
 * @param a - First location
 * @param b - Second location
 * @returns `true` when the paths match and the queries serialise alike
 */
function isSameLocation(a: ListLocation, b: ListLocation): boolean {
  return a.pathname === b.pathname
    && toSearchParams(a.search).toString() === toSearchParams(b.search).toString();
}
