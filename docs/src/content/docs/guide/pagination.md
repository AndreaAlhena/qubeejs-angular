---
title: Pagination
description: Move between pages, bind page state as signals, and parse responses with QubeePaginator.
---

The adapter covers both sides of pagination: moving the page on `QubeeQueryBuilder`, and parsing the response with `QubeePaginator`, which syncs the bounds the server reported back into the builder's signals. Every read is a signal.

> Pagination *modes* — query string or `Range` headers — what each driver reads from a response, and the shape of `PaginatedCollection` are core behaviour: see [Pagination ↗](https://qubeejs.andreatantimonaco.me/guide/pagination/). This page is about how the Angular adapter drives them.

## Moving between pages

Mutators on `QubeeQueryBuilder`; each returns `this`.

| Method | What it does |
| --- | --- |
| `nextPage()` | One page forward. Never throws; a no-op at the known last page. |
| `previousPage()` | One page back. Never throws; floored at page 1. |
| `firstPage()` | Page 1. Never throws. |
| `lastPage()` | The last page a response reported. Throws `PaginationNotSyncedError` before one has been parsed. |
| `goToPage(n)` | Page `n`. Throws `InvalidPageNumberError` unless `n` is a positive integer within the known bounds. |
| `setPage(n)` | Page `n`, without checking the bounds. |

The last page is known once `QubeePaginator.paginate()` has parsed a response — see [Syncing](#syncing) below.

## Page signals

| Signal | Value |
| --- | --- |
| `currentPage()` | `state.page` |
| `totalPages()` | The last page, or `undefined` until a response has been parsed |
| `isFirstPage()` | `page === 1` |
| `isLastPage()` | `false` until the last page is known, then `page === lastPage` |
| `hasNextPage()` | `true` until the last page is known, then `page < lastPage` |
| `hasPreviousPage()` | `page > 1` |

The predicates start from conservative defaults, so they bind straight into `[disabled]` with no guard, and a "Next" button stays enabled before the first response:

```html
<button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
<span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
<button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
```

Because they are signals, the template re-renders exactly when they change — with or without zone.js, and without a function re-run on every change-detection cycle.

`totalPages()` is `undefined` rather than throwing because a signal is read in templates, where "unknown" is the useful answer. `lastPage()`, the navigation method, keeps throwing for the imperative path.

## Parsing a response

However you fetch, hand the body — and the response headers, when the driver needs them — to `QubeePaginator.paginate()`:

```typescript
import { inject } from '@angular/core';
import { QubeePaginator } from '@qubeejs/angular';

private readonly _paginator = inject(QubeePaginator);

const page = this._paginator.paginate<User>(body, headers);
// page.data, page.page, page.lastPage, page.total, …
```

`paginate()` returns a typed `PaginatedCollection<T>`, the same shape for every driver. It performs no I/O.

The second argument accepts Angular's `HttpHeaders`, the native `Headers` class or a plain `Record<string, string>`, and is required by the drivers that report totals in headers — PostgREST (`Content-Range`), WordPress (`X-WP-Total`, `X-WP-TotalPages`) and Ransack. With `httpResource()` the headers come from `resource.headers()`; with `HttpClient`, request `{ observe: 'response' }` and pass `response.headers`. [Fetching data](/guide/fetching-data/#with-the-query-builder) shows both end to end.

:::caution[Bee aware]
`paginate()` writes to the store — that is how the signals above learn the last page — and Angular forbids signal writes inside `computed()`. Call it from an `effect()` that reads the response, or from an `HttpClient` callback.
:::

## Syncing

When `paginate()` parses a positive integer `lastPage`, it writes the bounds back into the store the builder reads:

- `state.page` ← the parsed page
- `state.lastPage` ← the parsed last page
- `state.isLastPageKnown` ← `true`

So `nextPage()`, `lastPage()`, `totalPages()` and the predicates reflect the server's bounds after the first parsed response, with no bookkeeping on your side, in the same tick. A server-reported `0` (an empty collection) or a missing last page leaves `isLastPageKnown` `false`, and the predicates keep their defaults.

The store's `state` signal compares snapshots structurally, so a sync that changes nothing — the page you asked for coming back as the page you are on — notifies nobody. That is what keeps an `httpResource()` bound to `uri()` from fetching again after every parsed response.

## Header-based pagination

`paginationHeaders()` is a signal holding the request headers the driver pages with, or `null`. Only PostgREST configured with `PaginationModeEnum.RANGE` uses it:

```typescript
provideQubee({ driver: POSTGREST_DRIVER, pagination: PaginationModeEnum.RANGE });

qb.setResource('users').setLimit(10);
qb.paginationHeaders();   // { 'Range-Unit': 'items', 'Range': '0-9' }
```

For every other driver it is `null`, so spreading it into a request's headers is safe everywhere. It compares by value and notifies only when the range moves, so the sync performed by `paginate()` never triggers a second fetch. [Fetching data](/guide/fetching-data/#postgrest-and-supabase) shows it in a request.

## Errors

| Error | Thrown by | When |
| --- | --- | --- |
| `PaginationNotSyncedError` | `lastPage()` | No response has synced the last page yet |
| `InvalidPageNumberError` | `setPage(n)`, `goToPage(n)` | `n` is not a positive integer, or exceeds the known last page (`goToPage()` only) |
| `InvalidLimitError` | `setLimit(n)` | The active driver does not accept `n` |

Every error carries a machine-readable `code` — `'PAGINATION_NOT_SYNCED'`, `'INVALID_PAGE_NUMBER'`, … — so you can branch without matching on message text.
