import type { HttpResourceRef, HttpResourceRequest } from '@angular/common/http';
import type { Injector, Signal } from '@angular/core';
import type { PaginatedCollection, PaginatedObject, RawResponse } from '@qubeejs/angular';

/**
 * Options of {@link qubeeHttpResource}
 */
export type QubeeHttpResourceOptions = {
  /**
   * Request options added to every request — `withCredentials`, a
   * `context` for your interceptors, extra `headers`. The list's own headers
   * (PostgREST's `Range`) win over yours on a clash, since paging depends on
   * them. Authentication belongs in an interceptor, which applies as usual.
   */
  init?: Omit<HttpResourceRequest, 'body' | 'method' | 'params' | 'url'>;

  /**
   * The injector the resource lives in; required outside an injection context
   */
  injector?: Injector;

  /**
   * Keep showing the previous page while the next one loads. Default `true`.
   */
  keepPreviousData?: boolean;
};

/**
 * What {@link qubeeHttpResource} returns
 *
 * @typeParam T - The shape of a row
 */
export type QubeeHttpResourceRef<T extends PaginatedObject> = {
  /**
   * Why the current request failed — an `HttpErrorResponse` for a status that
   * is not ok, else what the parser threw — or `undefined`
   */
  readonly error: Signal<unknown>;

  /**
   * A request is in flight
   */
  readonly isLoading: Signal<boolean>;

  /**
   * Fetch the current request again
   *
   * @returns Whether a reload was started
   */
  readonly reload: () => boolean;

  /**
   * The underlying `httpResource()`, for everything else — `statusCode`,
   * `headers`, `progress`, the raw `value`
   */
  readonly resource: HttpResourceRef<RawResponse | undefined>;

  /**
   * The page of the current request, parsed with the list's paginator. While
   * the next request is in flight it is the previous page, unless
   * `keepPreviousData` is `false`. `undefined` before the first answer, after
   * a failure, and while the request is `null`.
   */
  readonly value: Signal<PaginatedCollection<T> | undefined>;
};
