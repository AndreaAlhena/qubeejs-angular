---
sidebar_position: 4
title: Pagination
---

# Pagination

`@qubeejs/angular` covers both sides of pagination: building the request URI (with `setPage` / `setLimit` and the navigation helpers below) and parsing the paginated response into a typed `PaginatedCollection<T>`. Every read is a signal.

## Navigation helpers

Fluent methods that mutate `state.page`. All return `this` for chaining.

```typescript
qb.nextPage();        // state.page + 1, capped at lastPage if known
qb.previousPage();    // state.page - 1, floored at 1
qb.firstPage();       // page = 1
qb.lastPage();        // page = state.lastPage; throws if not synced yet
qb.goToPage(n);       // validates and sets, rejects n > lastPage when known
```

The `lastPage` value is populated automatically by `QubeePaginator.paginate()` — see [auto-sync](#auto-sync) below.

## State signals

```typescript
qb.currentPage();     // Signal<number> — state.page
qb.totalPages();      // Signal<number | undefined> — state.lastPage, undefined until paginate() has synced it
qb.state();           // Signal<QueryBuilderState> — the whole (frozen) state
```

`totalPages()` is `undefined` rather than throwing because a signal is read in templates, where "unknown" is the useful answer. `lastPage()` — the navigation helper — keeps throwing `PaginationNotSyncedError`, for the imperative path.

## Predicates (template-safe)

Computed signals with conservative defaults while the bounds are unknown — usable directly in `[disabled]` bindings without a guard:

```typescript
qb.isFirstPage();        // page === 1
qb.isLastPage();         // false until lastPage is known, then page === lastPage
qb.hasNextPage();        // true until lastPage is known, then page < lastPage
qb.hasPreviousPage();    // page > 1
```

Template wiring:

```html
<button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
<span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
<button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
```

Because these are signals, the template re-renders exactly when they change — no zone.js needed, no function re-invoked on every change-detection cycle.

## Parsing a response

However you fetch, pass the body (and headers, when relevant) to `QubeePaginator.paginate()`:

```typescript
const collection = this._pagination.paginate<User>(body);
// collection.data, collection.page, collection.lastPage, …
```

For the **PostgREST** and **WordPress** drivers, also pass the response headers — the total count lives in `Content-Range` (PostgREST, opt-in via `Prefer: count=exact`) or `X-WP-Total` / `X-WP-TotalPages` (WordPress, always sent):

```typescript
const collection = this._pagination.paginate<User>(body, headers);
```

The second argument accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>`. With `httpResource()` the headers come from `resource.headers()`; with `HttpClient`, request `{ observe: 'response' }` and pass `response.headers`. [Fetching data](./fetching-data.md) shows both end to end.

:::note Call `paginate()` from an effect or a callback, not from a `computed()`
`paginate()` writes to the store (see auto-sync below), and Angular forbids signal writes inside `computed()`. Put it in an `effect()` that reads the resource, or in the `HttpClient` callback.
:::

## `PaginatedCollection<T>`

The parsed shape is uniform across all drivers:

```typescript
class PaginatedCollection<T> {
  readonly data: T[];
  readonly page: number;
  readonly from?: number;
  readonly to?: number;
  readonly total?: number;
  readonly perPage?: number;
  readonly prevPageUrl?: string;
  readonly nextPageUrl?: string;
  readonly lastPage?: number;
  readonly firstPageUrl?: string;
  readonly lastPageUrl?: string;
}
```

Optional fields are `undefined` when the driver/server didn't provide them.

## Auto-sync

When `paginate()` returns a `PaginatedCollection` with a positive integer `lastPage`, the library writes it back into `QubeeSignalStore` automatically:

- `state.page` ← `collection.page`
- `state.lastPage` ← `collection.lastPage`
- `state.isLastPageKnown` ← `true`

This means the navigation helpers above ([`nextPage`](#navigation-helpers), [`lastPage`](#navigation-helpers), [predicates](#predicates-template-safe)) start working immediately after the first `paginate()` call — no consumer bookkeeping required — and the signals update in the same tick.

Server-emitted `0` (empty collection) and absent `lastPage` fields leave `isLastPageKnown` as `false`, so predicates fall back to their conservative defaults and `totalPages()` stays `undefined`.

The store's `state` signal compares snapshots structurally, so a sync that changes nothing — the page you asked for coming back as the page you are on — notifies nobody. That is what keeps an `httpResource()` bound to `uri()` from re-fetching after every parsed response.

## Errors

| Error | Thrown by | When |
|---|---|---|
| `PaginationNotSyncedError` | `lastPage()` | Called before any `paginate()` call has synced `lastPage` |
| `InvalidPageNumberError` | `setPage(n)`, `goToPage(n)` | `n` is not a positive integer, or exceeds `state.lastPage` when known |
| `InvalidLimitError` | `setLimit(n)` | `n` is not accepted by the active driver — see per-driver pages |

Every error carries a machine-readable `code` (`'PAGINATION_NOT_SYNCED'`, `'INVALID_PAGE_NUMBER'`, …) alongside its class, so you can branch without matching on message text.

## RANGE-header pagination (PostgREST only)

See [PostgREST → RANGE-header pagination](./drivers/postgrest.md#range-header-pagination) for opt-in details.

`paginationHeaders()` is a signal yielding the headers to apply (`{ 'Range-Unit': 'items', 'Range': '0-9' }`) or `null` for all other drivers — safe to spread into a headers map unconditionally. It compares by value, so it only notifies when the range actually moves.
