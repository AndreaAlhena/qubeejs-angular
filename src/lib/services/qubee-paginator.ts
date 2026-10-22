import type { HeaderBag, PaginatedCollection, PaginatedObject, RawResponse } from '@qubeejs/core';

import { inject, Injectable } from '@angular/core';
import { Paginator } from '@qubeejs/core';

import { QUBEE_RESPONSE_OPTIONS, QUBEE_RESPONSE_STRATEGY } from '../tokens/qubee.tokens';
import { QubeeSignalStore } from './qubee-signal-store';

/**
 * Parses backend responses into typed `PaginatedCollection`s and syncs the
 * page metadata back into the shared {@link QubeeSignalStore}
 *
 * Thin Angular wrapper over the core `Paginator`: DI supplies the store, the
 * response strategy and the response options for the active driver. It
 * performs no I/O — fetch however you like and hand the body back.
 */
@Injectable()
export class QubeePaginator {
  /**
   * The core paginator, wired to this scope's store and the active driver
   */
  private readonly _paginator = new Paginator(
    inject(QubeeSignalStore),
    inject(QUBEE_RESPONSE_STRATEGY),
    inject(QUBEE_RESPONSE_OPTIONS)
  );

  /**
   * Transform a raw API response into a typed PaginatedCollection
   *
   * Delegates to the active driver's response strategy for parsing, then
   * auto-syncs the parsed `page` and `lastPage` back into the store so the
   * pagination signals on `QubeeQueryBuilder` (`totalPages`, `isLastPage`,
   * `hasNextPage`, …) reflect the live server-reported bounds without
   * consumer bookkeeping.
   *
   * @remarks
   * `lastPage` is only synced when the response yields a positive integer.
   * Server-emitted `0` (empty collection edge case) and absent fields are
   * treated as "no useful info" and leave `isLastPageKnown: false`.
   *
   * @param response - The raw API response body. For drivers that emit a
   * bare array (PostgREST, WordPress, Ransack), pass the array.
   * @param headers - Optional HTTP response headers. Required by the drivers
   * that report pagination in headers: PostgREST (reads `Content-Range`),
   * WordPress (reads `X-WP-Total` / `X-WP-TotalPages` and `Link`) and Ransack
   * (reads Pagy's or Kaminari's headers and `Link`); body-only drivers ignore it.
   * Accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain
   * `Record<string, string>`.
   * @returns A typed PaginatedCollection instance
   */
  public paginate<T extends PaginatedObject>(
    response: RawResponse,
    headers?: HeaderBag
  ): PaginatedCollection<T> {
    return this._paginator.paginate<T>(response, headers);
  }
}
