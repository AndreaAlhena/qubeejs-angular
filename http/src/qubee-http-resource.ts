import type { HttpResourceRequest } from '@angular/common/http';
import type {
  ListRequest,
  PaginatedCollection,
  PaginatedObject,
  RawResponse,
} from '@qubeejs/angular';

import { HttpHeaders, httpResource } from '@angular/common/http';
import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  Injector,
  signal,
} from '@angular/core';

import type {
  QubeeHttpResourceOptions,
  QubeeHttpResourceRef,
} from './types/qubee-http-resource.type';

/**
 * Fetch the page a list request asks for, and fetch again when it changes
 *
 * Takes the `request` of `injectQubeeList()` — or any function returning a
 * core `ListRequest` — and returns the parsed page as a signal. Built on
 * Angular's `httpResource()`, so it goes through `HttpClient` and your
 * interceptors, aborts a request a newer one has made stale, and needs
 * `provideHttpClient()` and Angular 19.2 or later.
 *
 * - Fetches once per navigation, never per keystroke: a list's `request`
 *   changes only when the URI or the headers do.
 * - Sends the request's headers — PostgREST's `Range` in `RANGE` mode — and
 *   hands the response headers to `paginate()`, so header-driven drivers
 *   (PostgREST, WordPress, Ransack) read their totals without extra code.
 * - Keeps the previous page on screen while the next one loads.
 * - A `null` request fetches nothing.
 *
 * @example
 * ```ts
 * export class ArticlesComponent {
 *   protected readonly list = injectQubeeList(articleList);
 *   protected readonly articles = qubeeHttpResource<Article>(this.list.request);
 * }
 * ```
 * ```html
 * @for (article of articles.value()?.data; track article.id) { <p>{{ article.title }}</p> }
 * ```
 *
 * @param request - The request to fetch; `null` or `undefined` fetches nothing
 * @param options - Request options, the injector, and whether to keep the previous page
 * @returns The page and the state of its request, as signals
 * @throws If called outside an injection context without an `injector`
 */
export function qubeeHttpResource<T extends PaginatedObject>(
  request: () => ListRequest | null | undefined,
  options: QubeeHttpResourceOptions = {}
): QubeeHttpResourceRef<T> {
  if (!options.injector) {
    assertInInjectionContext(qubeeHttpResource);
  }

  const { init = {}, injector = inject(Injector), keepPreviousData = true } = options;

  const resource = httpResource<RawResponse>(
    () => {
      const current = request();

      return current
        ? { ...init, headers: mergeHeaders(init.headers, current.headers), url: current.uri }
        : undefined;
    },
    { injector }
  );

  const parsed = computed(() => {
    const current = request();

    return current && resource.hasValue()
      ? current.paginate<T>(resource.value(), resource.headers())
      : undefined;
  });

  // httpResource() resets its value whenever the request changes, so the
  // last page is recorded here — in an effect, so that it is kept whether or
  // not anything read it before the next request started.
  const last = signal<PaginatedCollection<T> | undefined>(undefined);

  effect(
    () => {
      const page = parsed();

      if (page) {
        last.set(page);
      } else if (!request() || resource.error() !== undefined) {
        last.set(undefined);
      }
    },
    { injector }
  );

  const value = computed(() => {
    if (!request() || resource.error() !== undefined) {
      return undefined;
    }

    return parsed() ?? (keepPreviousData && resource.isLoading() ? last() : undefined);
  });

  return {
    error: resource.error,
    isLoading: resource.isLoading,
    reload: () => resource.reload(),
    resource,
    value,
  };
}

/**
 * Add the list's headers to the caller's, the list's winning on a clash
 *
 * @param extra - The headers from `init`, in either shape `httpResource()` takes
 * @param own - The list request's headers, or `null`
 * @returns The merged headers, in the shape `extra` had
 */
function mergeHeaders(
  extra: HttpResourceRequest['headers'],
  own: Readonly<Record<string, string>> | null
): HttpResourceRequest['headers'] {
  if (!own) {
    return extra;
  }

  if (extra instanceof HttpHeaders) {
    return Object.entries(own).reduce((headers, [name, value]) => headers.set(name, value), extra);
  }

  return { ...extra, ...own };
}
