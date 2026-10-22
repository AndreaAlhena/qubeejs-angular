---
slug: 3.8/drivers/postgrest
title: "PostgREST / Supabase Driver"
sidebar:
  label: "PostgREST / Supabase"
---

Targets [PostgREST](https://postgrest.org/) and anything built on it — most notably [Supabase](https://supabase.com/).

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.POSTGREST })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `col=eq.value` |
| Filters (multi-value) | `col=in.(v1,v2,v3)` |
| Operator filters | full `FilterOperatorEnum` mapping — see below |
| Sort | `order=col1.asc,col2.desc` |
| Flat select | `select=col1,col2` |
| Embedded resources | `select=col1,rel(col1,col2)` — spliced into the same `select` param |
| Pagination | `limit=15&offset=0` (offset omitted on page 1) |

## Operator filters

Every `FilterOperatorEnum` value maps to PostgREST's prefix syntax:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);             // age=gte.18
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);           // id=in.(1,2,3)
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'deleted');    // status=not.eq.deleted
qb.addFilterOperator('id', FilterOperatorEnum.NOT, 1, 2);             // id=not.in.(1,2)
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);     // deletedAt=is.null
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);    // deletedAt=is.not.null
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 100);       // price=gte.10&price=lte.100
qb.addFilterOperator('email', FilterOperatorEnum.SW, 'admin');        // email=like.admin*
qb.addFilterOperator('name', FilterOperatorEnum.CONTAINS, 'john');    // name=ilike.%john%
```

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`[min, max]`).
- `NULL` requires exactly **1 boolean value** (`true` → `IS NULL`, `false` → `IS NOT NULL`).

Other operators leave shape validation to the server.

### Full-text search

Four PostgREST-native variants:

```typescript
qb.addFilterOperator('description', FilterOperatorEnum.FTS, 'rat');     // description=fts.rat
qb.addFilterOperator('description', FilterOperatorEnum.PLFTS, 'a b');   // description=plfts.a b
qb.addFilterOperator('description', FilterOperatorEnum.PHFTS, 'a b');   // description=phfts.a b
qb.addFilterOperator('description', FilterOperatorEnum.WFTS, 'a -b');   // description=wfts.a -b
```

| Operator | SQL function | Meaning |
|---|---|---|
| `FTS` | `to_tsquery` | Raw tsquery syntax (advanced) |
| `PLFTS` | `plainto_tsquery` | Plain text, words AND-ed |
| `PHFTS` | `phraseto_tsquery` | Plain text as a phrase |
| `WFTS` | `websearch_to_tsquery` | Google-like syntax (`-term`, `"phrase"`) |

Language modifiers (`fts(english).term`) are not supported in this release.

## Embedded resources

PostgREST pulls related-table columns inline through the `select` query parameter — its idiomatic join mechanism, used heavily by Supabase. The driver exposes it via `addEmbedded(relation, ...columns)`:

```typescript
qb.addEmbedded('author', 'id', 'name')   // author(id,name)
  .addEmbedded('comments')               // comments(*) — no columns = all columns
  .addSelect('title');

// → /articles?select=title,author(id,name),comments(*)&limit=15
```

The embedded fragments are **spliced into the single `select=` parameter** alongside flat columns from `addSelect` — never emitted as a second `select`. When you add embedded relations without any `addSelect` call, the flat part defaults to `*` so the base row's columns stay in the projection:

```typescript
qb.addEmbedded('author');   // → select=*,author(*)
```

Calling `addEmbedded` repeatedly with the same relation merge-dedups the columns. `deleteEmbedded('author')` removes the whole relation entry. Neither resets the page (column shape change, not record-set change). On every other driver both methods throw `UnsupportedEmbeddedError`.

Out of scope for now: nested embedding (`author(posts(*))`), filtering on embedded columns (`author.country=eq.US`), and ordering by embedded columns.

## Reading totals from `Content-Range`

PostgREST returns a bare array body and reports the total count in the `Content-Range` HTTP response header. Opt in via `Prefer: count=exact` on the request, then pass the headers to `paginate()`:

```typescript
this._http.get<User[]>(uri, {
  observe: 'response',
  headers: { 'Prefer': 'count=exact' }
}).subscribe(response => {
  const collection = this._pagination.paginate(response.body, response.headers);
  // collection.total, collection.page, collection.lastPage are populated
});
```

The second argument accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>`. Omitting the header is tolerated — the collection still populates `data` and `page` but leaves `total` / `lastPage` undefined.

## RANGE-header pagination

PostgREST also accepts pagination via the `Range` HTTP request header instead of URL query params. Opt in via `IConfig.pagination`:

```typescript
import { DriverEnum, PaginationModeEnum, provideNgQubee } from 'ng-qubee';

provideNgQubee({
  driver: DriverEnum.POSTGREST,
  pagination: PaginationModeEnum.RANGE
});
```

When `RANGE` is active, `generateUri()` omits `limit` and `offset` from the URL. `NgQubeeService.paginationHeaders()` returns the headers to apply:

```typescript
const uri = await firstValueFrom(qb.generateUri());
const extraHeaders = qb.paginationHeaders();  // { 'Range-Unit': 'items', 'Range': '0-9' }

this._http.get<User[]>(uri, {
  observe: 'response',
  headers: { 'Prefer': 'count=exact', ...extraHeaders }
}).subscribe(resp => this._pagination.paginate(resp.body, resp.headers));
```

`paginationHeaders()` returns `null` for any driver that doesn't use header-based pagination — safe to spread unconditionally.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Implicit `eq`; multi-value becomes `in.(...)` |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | All 16 operators including `FTS`/`PLFTS`/`PHFTS`/`WFTS` |
| `addSort` / `deleteSorts` | ✓ | Emits `order=col.asc,col.desc` |
| `addSelect` / `deleteSelect` | ✓ | Flat column selection |
| `addEmbedded` / `deleteEmbedded` | ✓ | Embedded resources spliced into `select` — see above |
| `setLimit` / `setPage` | ✓ | `offset` derived from `page` (QUERY) or `Range` header (RANGE) |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | Use `addSelect` for column projection |
| `addIncludes` / `deleteIncludes` | ✗ | Use `addEmbedded` — PostgREST has no standalone `include` param |
| `setSearch` / `deleteSearch` | ✗ | Use `addFilterOperator(col, FilterOperatorEnum.FTS, term)` instead |
