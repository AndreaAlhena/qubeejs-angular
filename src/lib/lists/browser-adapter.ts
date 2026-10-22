import { DOCUMENT } from '@angular/common';
import { DestroyRef, Provider, inject, signal } from '@angular/core';

import type { ListLocation } from '@qubeejs/core';

import type { QubeeListAdapter, QubeeListNavigateOptions } from '../types/qubee-list-adapter.type';

import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { isSameLocation } from '../utils/parse-href';

/**
 * Provide an adapter that reads and writes the address bar through the
 * History API, for an application without the Angular Router
 *
 * Lists navigate with `history.pushState()` / `replaceState()` and follow
 * Back and Forward through `popstate`; every list under the provider stays in
 * sync. A `history.pushState()` by other code is not seen until the next
 * `popstate`. With the Angular Router, use `provideQubeeRouterAdapter()` from
 * `@qubeejs/angular/router` instead, or the router falls out of step.
 *
 * ```ts
 * bootstrapApplication(AppComponent, { providers: [provideQubeeBrowserAdapter()] });
 * ```
 *
 * On the server there is no history: the location is empty and navigating
 * does nothing.
 *
 * @returns The provider for `QUBEE_LIST_ADAPTER`
 */
export function provideQubeeBrowserAdapter(): Provider[] {
  return [{ provide: QUBEE_LIST_ADAPTER, useFactory: createBrowserAdapter }];
}

/**
 * Build the History API adapter in the current injection context
 *
 * @returns The adapter
 */
function createBrowserAdapter(): QubeeListAdapter {
  const view = inject(DOCUMENT).defaultView;
  const read = (): ListLocation => ({
    pathname: view?.location.pathname ?? '',
    search: view?.location.search ?? ''
  });
  const location = signal(read(), { equal: isSameLocation });

  if (view) {
    const onPopState = (): void => location.set(read());

    view.addEventListener('popstate', onPopState);
    inject(DestroyRef).onDestroy(() => view.removeEventListener('popstate', onPopState));
  }

  return {
    location: location.asReadonly(),
    navigate: (href: string, { replace }: QubeeListNavigateOptions): void => {
      if (!view) {
        return;
      }

      if (replace) {
        view.history.replaceState(view.history.state, '', href);
      } else {
        view.history.pushState(null, '', href);
      }

      location.set(read());
    }
  };
}
