---
slug: 3.8/guide/pagination
title: "Pagination"
---

`ng-qubee` covers both sides of pagination: building the request URI (with `setPage` / `setLimit` and the navigation helpers below) and parsing the paginated response into a typed `PaginatedCollection<T>`.

## Navigation helpers

Fluent methods that mutate `state.page`. All return `this` for chaining.

```typescript
qb.nextPage();        // state.page + 1, capped at lastPage if known
qb.previousPage();    // state.page - 1, floored at 1
qb.firstPage();       // page = 1
qb.lastPage();        // page = state.lastPage; throws if not synced yet
qb.goToPage(n);       // validates and sets, rejects n > lastPage when known
```

The `lastPage` value is populated automatically by `PaginationService.paginate()` — see [auto-sync](#auto-sync) below.

## State accessors

```typescript
qb.currentPage();     // state.page (always safe)
qb.totalPages();      // state.lastPage; throws if paginate() hasn't run yet
```

## Predicates (template-safe)

Conservative defaults when bounds are unknown — usable directly in `[disabled]` bindings without a guard:

```typescript
qb.isFirstPage();        // page === 1
qb.isLastPage();         // false until lastPage is known, then page === lastPage
qb.hasNextPage();        // true until lastPage is known, then page < lastPage
qb.hasPreviousPage();    // page > 1
```

Template wiring:

```html
<button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
<span>Page {{ qb.currentPage() }} of {{ qb.totalPages() }}</span>
<button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
```

## Parsing a response

Every driver hands you an `Observable<HttpResponse>` from your HTTP client. Pass the body (and headers, when relevant) to `PaginationService.paginate()`:

```typescript
this._http.get(uri).subscribe(body => {
  const collection = this._pagination.paginate(body);
  // collection.data, collection.page, collection.lastPage, …
});
```

For the **PostgREST** and **WordPress** drivers, also pass headers — the total count lives in `Content-Range` (PostgREST, opt-in via `Prefer: count=exact`) or `X-WP-Total` / `X-WP-TotalPages` (WordPress, always sent):

```typescript
this._http.get(uri, { observe: 'response', headers: { 'Prefer': 'count=exact' } })
  .subscribe(response => {
    const collection = this._pagination.paginate(response.body, response.headers);
  });
```

The second argument accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>`.

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

When `paginate()` returns a `PaginatedCollection` with a positive integer `lastPage`, the library writes it back into `NestService` automatically:

- `state.page` ← `collection.page`
- `state.lastPage` ← `collection.lastPage`
- `state.isLastPageKnown` ← `true`

This means the navigation helpers above ([`nextPage`](#navigation-helpers), [`lastPage`](#navigation-helpers), [predicates](#predicates-template-safe)) start working immediately after the first `paginate()` call — no consumer bookkeeping required.

Server-emitted `0` (empty collection) and absent `lastPage` fields leave `isLastPageKnown` as `false` so predicates fall back to their conservative defaults.

## Errors

| Error | Thrown by | When |
|---|---|---|
| `PaginationNotSyncedError` | `lastPage()`, `totalPages()` | Called before any `paginate()` call has synced `lastPage` |
| `InvalidPageNumberError` | `setPage(n)`, `goToPage(n)` | `n` is not a positive integer, or exceeds `state.lastPage` when known |
| `InvalidLimitError` | `setLimit(n)` | `n` is not accepted by the active driver — see per-driver pages |

## RANGE-header pagination (PostgREST only)

See [PostgREST → RANGE-header pagination](/3.8/drivers/postgrest/#range-header-pagination) for opt-in details.

`paginationHeaders()` returns the headers to apply (`{ 'Range-Unit': 'items', 'Range': '0-9' }`) or `null` for all other drivers — safe to spread into a headers map unconditionally.
