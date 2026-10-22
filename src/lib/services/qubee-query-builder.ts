import type { Signal} from '@angular/core';
import type { Fields, FilterOperatorEnum, QueryBuilderState, SortEnum } from '@qubeejs/core';

import { computed, inject, Injectable } from '@angular/core';
import { QueryBuilder } from '@qubeejs/core';

import { QUBEE_DRIVER, QUBEE_REQUEST_OPTIONS, QUBEE_REQUEST_STRATEGY } from '../tokens/qubee.tokens';
import { deepEqual } from '../utils/deep-equal';
import { QubeeSignalStore } from './qubee-signal-store';

/**
 * The query builder, as an Angular service
 *
 * Wraps the framework-agnostic `QueryBuilder` from `@qubeejs/core` and adds
 * the reactivity the core deliberately leaves to adapters: every read is a
 * `Signal`, so templates, `computed()`, `effect()` and `httpResource()`
 * track the query state without any glue.
 *
 * Two kinds of members:
 *
 * - **Mutators** (`setResource`, `addFilter`, `nextPage`, …) write to the
 *   shared {@link QubeeSignalStore} and return `this` for chaining. They throw
 *   the core's `Unsupported*Error`s when the active driver lacks the
 *   capability.
 * - **Readers** (`uri`, `state`, `currentPage`, `hasNextPage`, …) are
 *   computed signals. They are read by calling them — `qb.hasNextPage()` —
 *   which is exactly how the 3.x methods were called, but they now
 *   re-evaluate only when the state changes.
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
 *     <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
 *     <button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
 *   `
 * })
 * export class UsersComponent {
 *   protected readonly qb = inject(QubeeQueryBuilder);
 *
 *   // Re-fetches whenever the URI changes; idle until a resource is set.
 *   protected readonly users = httpResource<unknown>(() => this.qb.uri());
 *
 *   constructor() {
 *     this.qb.setResource('users').addSort('created_at', SortEnum.DESC);
 *   }
 * }
 * ```
 */
@Injectable()
export class QubeeQueryBuilder {

  /**
   * Resolved query parameter key name options
   */
  private readonly _options = inject(QUBEE_REQUEST_OPTIONS);

  /**
   * The request strategy that builds URIs for the active driver
   */
  private readonly _requestStrategy = inject(QUBEE_REQUEST_STRATEGY);

  /**
   * The store shared with `QubeePaginator` in this injector scope
   */
  private readonly _store = inject(QubeeSignalStore);

  /**
   * The core builder every mutator delegates to
   */
  private readonly _builder = new QueryBuilder(
    this._store,
    this._requestStrategy,
    this._options,
    inject(QUBEE_DRIVER).id
  );

  /**
   * The complete query-builder state
   *
   * The snapshot is deeply frozen: read it freely, mutate it never.
   */
  public readonly state: Signal<QueryBuilderState> = this._store.state;

  /**
   * The current page number
   */
  public readonly currentPage: Signal<number> = computed(() => this.state().page);

  /**
   * Whether a next page exists
   *
   * `true` until a paginated response has synced the bounds (conservative
   * default), then `page < lastPage`.
   */
  public readonly hasNextPage: Signal<boolean> = computed(() => {
    const state = this.state();

    return !state.isLastPageKnown || state.page < state.lastPage;
  });

  /**
   * Whether a previous page exists (`page > 1`)
   */
  public readonly hasPreviousPage: Signal<boolean> = computed(() => this.state().page > 1);

  /**
   * Whether the current page is the first page
   */
  public readonly isFirstPage: Signal<boolean> = computed(() => this.state().page === 1);

  /**
   * Whether the current page is the last page
   *
   * `false` until a paginated response has synced the bounds, so a "Next"
   * button bound to it stays enabled before the first fetch.
   */
  public readonly isLastPage: Signal<boolean> = computed(() => {
    const state = this.state();

    return state.isLastPageKnown && state.page === state.lastPage;
  });

  /**
   * HTTP request headers the active driver wants applied to the request
   *
   * `null` for drivers that pass all pagination metadata on the URL — every
   * driver except PostgREST configured with `PaginationModeEnum.RANGE`, which
   * yields `{ 'Range-Unit': 'items', 'Range': 'from-to' }`. Safe to spread
   * into a headers map unconditionally.
   *
   * Compared by value, so a state change that leaves the range untouched —
   * a synced `lastPage`, say — does not re-trigger an `httpResource()` whose
   * request spreads these headers.
   */
  public readonly paginationHeaders: Signal<Record<string, string> | null> = computed(
    () => this._requestStrategy.buildPaginationHeaders?.(this.state()) ?? null,
    { equal: deepEqual }
  );

  /**
   * The total number of pages reported by the most recent paginated response,
   * or `undefined` until `QubeePaginator.paginate()` has synced one
   *
   * The 3.x method threw `PaginationNotSyncedError` here; a signal is read in
   * templates, where `undefined` is the useful answer. `lastPage()` keeps the
   * throwing behaviour for imperative navigation.
   */
  public readonly totalPages: Signal<number | undefined> = computed(() => {
    const state = this.state();

    return state.isLastPageKnown ? state.lastPage : undefined;
  });

  /**
   * The URI for the current state, or `undefined` until a resource is set
   *
   * Recomputed on every state change. `undefined` is the idle sentinel
   * `httpResource()` understands, so `httpResource(() => qb.uri())` stays idle
   * until `setResource()` is called and re-fetches on every mutation after.
   *
   * Always equal to {@link generateUri}: both go through the core builder,
   * which appends the parameters set with {@link setParam} after the driver's
   * own.
   *
   * @throws The same errors as {@link generateUri} when the state is invalid
   * for the active driver (e.g. `UnselectableModelError`, `ParamCollisionError`)
   */
  public readonly uri: Signal<string | undefined> = computed(() => {
    // Reading the signal is what makes this computed track the state; the
    // core builder reads the same snapshot from the store.
    if (!this.state().resource) {
      return undefined;
    }

    return this._builder.generateUri();
  });

  /**
   * Add an embedded resource to the select statement (PostgREST, OData, Directus)
   *
   * ```
   * qb.addEmbedded('author', 'id', 'name')
   *   .addEmbedded('comments')
   *   .addSelect('title');
   * // PostgREST → select=title,author(id,name),comments(*)
   * ```
   *
   * Repeated calls for the same relation merge-dedup the columns. Does not
   * reset the page.
   *
   * @param relation - The related table / foreign-key name as the backend sees it
   * @param columns - Optional column projection; omit for `relation(*)`
   * @returns {this}
   * @throws {UnsupportedEmbeddedError} If the active driver does not support embedded resources
   */
  public addEmbedded(relation: string, ...columns: string[]): this {
    this._builder.addEmbedded(relation, ...columns);

    return this;
  }

  /**
   * Add fields to the select statement for the given model (JSON:API and Spatie)
   *
   * @param model - Model that holds the fields
   * @param fields - Fields to select
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public addFields(model: string, fields: string[]): this {
    this._builder.addFields(model, fields);

    return this;
  }

  /**
   * Add a filter with the given value(s)
   *
   * Multi-value calls merge per field. Resets the page to 1.
   *
   * @param field - Name of the field to filter
   * @param values - The needle(s)
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public addFilter(field: string, ...values: (string | number | boolean)[]): this {
    this._builder.addFilter(field, ...values);

    return this;
  }

  /**
   * Add a filter with an explicit operator
   *
   * Resets the page to 1.
   *
   * @param field - Name of the field to filter
   * @param operator - The filter operator to apply
   * @param values - The value(s) for the filter
   * @returns {this}
   * @throws {UnsupportedFilterOperatorError} If the active driver does not support filter operators, or this operator
   * @throws {InvalidFilterOperatorValueError} If the values do not fit the operator (e.g. `BTW` without exactly two)
   */
  public addFilterOperator(field: string, operator: FilterOperatorEnum, ...values: (string | number | boolean)[]): this {
    this._builder.addFilterOperator(field, operator, ...values);

    return this;
  }

  /**
   * Add related entities to include in the request
   *
   * @param models - Models to include
   * @returns {this}
   * @throws {UnsupportedIncludesError} If the active driver does not support includes
   */
  public addIncludes(...models: string[]): this {
    this._builder.addIncludes(...models);

    return this;
  }

  /**
   * Add flat field selection (`select=col1,col2`)
   *
   * @param fields - Fields to select
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public addSelect(...fields: string[]): this {
    this._builder.addSelect(...fields);

    return this;
  }

  /**
   * Add a field with a sort criteria
   *
   * Resets the page to 1.
   *
   * @param field - Field to use for sorting
   * @param order - A value from the `SortEnum` enumeration
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public addSort(field: string, order: SortEnum): this {
    this._builder.addSort(field, order);

    return this;
  }

  /**
   * Remove embedded resources from the current state (PostgREST, OData, Directus)
   *
   * Removes the whole relation entry, columns included.
   *
   * @param relations - Relation names to remove
   * @returns {this}
   * @throws {UnsupportedEmbeddedError} If the active driver does not support embedded resources
   */
  public deleteEmbedded(...relations: string[]): this {
    this._builder.deleteEmbedded(...relations);

    return this;
  }

  /**
   * Delete selected fields for the given models (JSON:API and Spatie)
   *
   * ```
   * qb.deleteFields({ users: ['email', 'password'], address: ['zipcode'] });
   * ```
   *
   * @param fields - Object mapping model names to field arrays to remove
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public deleteFields(fields: Fields): this {
    this._builder.deleteFields(fields);

    return this;
  }

  /**
   * Delete selected fields for the given model (JSON:API and Spatie)
   *
   * ```
   * qb.deleteFieldsByModel('users', 'email', 'password');
   * ```
   *
   * @param model - Model that holds the fields
   * @param fields - Fields to delete from the state
   * @returns {this}
   * @throws {UnsupportedFieldSelectionError} If the active driver does not support per-model field selection
   */
  public deleteFieldsByModel(model: string, ...fields: string[]): this {
    this._builder.deleteFieldsByModel(model, ...fields);

    return this;
  }

  /**
   * Remove the given filters from the state
   *
   * Resets the page to 1.
   *
   * @param filters - Filter field names to remove
   * @returns {this}
   * @throws {UnsupportedFilterError} If the active driver does not support filters
   */
  public deleteFilters(...filters: string[]): this {
    this._builder.deleteFilters(...filters);

    return this;
  }

  /**
   * Remove related models from the state
   *
   * @param includes - Models to remove
   * @returns {this}
   * @throws {UnsupportedIncludesError} If the active driver does not support includes
   */
  public deleteIncludes(...includes: string[]): this {
    this._builder.deleteIncludes(...includes);

    return this;
  }

  /**
   * Remove operator filters by field name
   *
   * Resets the page to 1.
   *
   * @param fields - Field names of operator filters to remove
   * @returns {this}
   * @throws {UnsupportedFilterOperatorError} If the active driver does not support filter operators
   */
  public deleteOperatorFilters(...fields: string[]): this {
    this._builder.deleteOperatorFilters(...fields);

    return this;
  }

  /**
   * Remove extra query parameters set with {@link setParam} (all drivers)
   *
   * Resets the page to 1. Calling it with no keys is a no-op.
   *
   * @param keys - Parameter keys to remove
   * @returns {this}
   */
  public deleteParams(...keys: string[]): this {
    this._builder.deleteParams(...keys);

    return this;
  }

  /**
   * Remove the search term from the state
   *
   * Resets the page to 1.
   *
   * @returns {this}
   * @throws {UnsupportedSearchError} If the active driver does not support search
   */
  public deleteSearch(): this {
    this._builder.deleteSearch();

    return this;
  }

  /**
   * Remove flat field selections from the state
   *
   * @param fields - Fields to remove from selection
   * @returns {this}
   * @throws {UnsupportedSelectError} If the active driver does not support flat field selection
   */
  public deleteSelect(...fields: string[]): this {
    this._builder.deleteSelect(...fields);

    return this;
  }

  /**
   * Remove sort rules from the state
   *
   * Resets the page to 1.
   *
   * @param sorts - Fields used for sorting to remove
   * @returns {this}
   * @throws {UnsupportedSortError} If the active driver does not support sorts
   */
  public deleteSorts(...sorts: string[]): this {
    this._builder.deleteSorts(...sorts);

    return this;
  }

  /**
   * Navigate to the first page
   *
   * @remarks Never throws. Idempotent when already on page 1.
   * @returns {this}
   */
  public firstPage(): this {
    this._builder.firstPage();

    return this;
  }

  /**
   * Build the URI for the current state using the active driver
   *
   * Synchronous: URI construction performs no I/O. For a reactive read that
   * follows every state change, use the {@link uri} signal instead.
   *
   * @returns The generated URI
   * @throws {Error} If the resource is unset
   * @throws {UnselectableModelError} If fields were selected on a model that is neither the resource nor included
   */
  public generateUri(): string {
    return this._builder.generateUri();
  }

  /**
   * Navigate directly to the specified page
   *
   * @param n - Target page number
   * @returns {this}
   * @throws {InvalidPageNumberError} If `n` is not a positive integer, or exceeds the last page when the bounds are known
   */
  public goToPage(n: number): this {
    this._builder.goToPage(n);

    return this;
  }

  /**
   * Navigate to the last page known from the most recent paginated response
   *
   * @returns {this}
   * @throws {PaginationNotSyncedError} If no paginated response has been synced yet — read {@link totalPages} first to guard
   */
  public lastPage(): this {
    this._builder.lastPage();

    return this;
  }

  /**
   * Navigate to the next page
   *
   * @remarks Never throws. No-op at the known last page. Pair with {@link hasNextPage} for a disable-state binding.
   * @returns {this}
   */
  public nextPage(): this {
    this._builder.nextPage();

    return this;
  }

  /**
   * Navigate to the previous page
   *
   * @remarks Never throws. Floored at page 1. Pair with {@link hasPreviousPage} for a disable-state binding.
   * @returns {this}
   */
  public previousPage(): this {
    this._builder.previousPage();

    return this;
  }

  /**
   * Clear the state and reset the query builder to a fresh, clean condition
   *
   * @returns {this}
   */
  public reset(): this {
    this._builder.reset();

    return this;
  }

  /**
   * Set the base URL to prepend to generated URIs
   *
   * @param baseUrl - The base URL (e.g. `https://api.example.com`)
   * @returns {this}
   */
  public setBaseUrl(baseUrl: string): this {
    this._builder.setBaseUrl(baseUrl);

    return this;
  }

  /**
   * Set the items-per-page number
   *
   * Validation is delegated to the active request strategy because the
   * accepted range is driver-specific: nestjs-paginate accepts `-1` as a
   * "fetch all" sentinel, the others require a positive integer. Resets the
   * page to 1.
   *
   * @param limit - Number of items per page
   * @returns {this}
   * @throws {InvalidLimitError} If the value is not accepted by the active driver
   */
  public setLimit(limit: number): this {
    this._builder.setLimit(limit);

    return this;
  }

  /**
   * Set the page the backend will use to paginate the result set
   *
   * @param page - Page number
   * @returns {this}
   * @throws {InvalidPageNumberError} If `page` is not a positive integer
   */
  public setPage(page: number): this {
    this._builder.setPage(page);

    return this;
  }

  /**
   * Set a query parameter no driver models (all drivers)
   *
   * For what a backend accepts beyond the driver's own parameters — a
   * top-level `status`, an `include` on a driver without includes. Appended
   * after the driver's parameters, so it works with every driver and is not
   * gated by capabilities:
   *
   * ```
   * qb.setParam('status', 'failed');  // → status=failed
   * qb.setParam('ids', 'a,b', 'c');   // → ids=a%2Cb,c
   * ```
   *
   * The key is emitted verbatim — never build one from end-user input — and
   * each value is percent-encoded like a filter value. Setting a key again
   * replaces its values; calling it with no values is a no-op. Resets the page
   * to 1.
   *
   * @param key - The parameter name, emitted verbatim
   * @param values - The value(s), joined with `,`
   * @returns {this}
   * @throws {ParamCollisionError} From {@link generateUri} and {@link uri}, when the key collides with a parameter the driver emits
   */
  public setParam(key: string, ...values: (string | number | boolean)[]): this {
    this._builder.setParam(key, ...values);

    return this;
  }

  /**
   * Set the API resource to run the query against
   *
   * Resets the page to 1.
   *
   * @param resource - Resource name (e.g. `'users'` produces `/users`)
   * @returns {this}
   * @throws {InvalidResourceNameError} If `resource` is not a non-empty string
   */
  public setResource(resource: string): this {
    this._builder.setResource(resource);

    return this;
  }

  /**
   * Set the search term for full-text search
   *
   * Resets the page to 1.
   *
   * @param search - The search term
   * @returns {this}
   * @throws {UnsupportedSearchError} If the active driver does not support search
   */
  public setSearch(search: string): this {
    this._builder.setSearch(search);

    return this;
  }
}
