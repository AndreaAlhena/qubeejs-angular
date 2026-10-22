---
sidebar_position: 13
title: json-server
---

# json-server Driver

Targets [json-server](https://github.com/typicode/json-server) — the de-facto standard mock REST API for frontend prototyping, with its colon-separated `field:operator=value` syntax and underscore-prefixed system params.

## Configure

```typescript
import { JSON_SERVER_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: JSON_SERVER_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` (bare exact match) |
| Filters (multi-value) | `field:in=v1,v2` (CSV) |
| Operator filters | colon syntax `field:op=value` — see below |
| Sort | `_sort=-views,title` (CSV, `-` prefix = DESC) |
| Search | `q=term` (full-text search) |
| Pagination | `_page=N&_per_page=M` |

The underscore-prefixed system params (`_page`, `_per_page`, `_sort`) and the `q` key are fixed by the server and ignore `request` key overrides — the underscore prefix is how json-server tells system params apart from filter fields.

## Operator filters

`FilterOperatorEnum` translates to json-server's colon operators:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('views', FilterOperatorEnum.GT, 100);            // views:gt=100
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'hello');  // title:contains=hello
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');        // title:startsWith=Intro
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // id:in=1,2,3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');      // status:ne=draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');     // status:ne=a&status:ne=b
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // price:gte=10&price:lte=50
```

### Translation table

| `FilterOperatorEnum` | json-server expression |
|---|---|
| `EQ` | `:eq` |
| `GT` / `GTE` / `LT` / `LTE` | `:gt` / `:gte` / `:lt` / `:lte` |
| `CONTAINS` | `:contains` |
| `IN` | `:in` (CSV) |
| `SW` | `:startsWith` |
| `BTW` | two AND-ed params (`field:gte=min&field:lte=max`, arity-checked) |
| `NOT` (single) | `:ne` |
| `NOT` (multi) | one `:ne` param per value, AND-ed |
| `ILIKE` | **unsupported** — no case-insensitive variant; throws `UnsupportedFilterOperatorError` |
| `NULL` | **unsupported** — no null-check operator; throws `UnsupportedFilterOperatorError` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

json-server's `:endsWith` operator has no `FilterOperatorEnum` counterpart and is not exposed.

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`) — enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Bare exact match (single) or `:in` CSV (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `_sort=` with `-` prefix for DESC |
| `setLimit` / `setPage` | ✓ | `_page` + `_per_page` |
| `addSelect` / `deleteSelect` | ✗ | No column-projection parameter |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | No relation-loading parameter exposed by this driver |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✓ | `q=term` full-text search |

## Response shape

json-server v1 paginated responses are flat, with **page numbers** (not URLs) for navigation:

```json
{
  "first": 1,
  "prev": null,
  "next": 2,
  "last": 5,
  "pages": 5,
  "items": 48,
  "data": [{ "id": 1, "title": "Hello" }]
}
```

`JsonServerResponseStrategy` maps `items → total` and `pages → lastPage`, then derives position from the page numbers:

- `page` is `prev + 1` (`prev: null` → page 1).
- `perPage` is the item count of any page that has a `next` successor (such a page is necessarily full); on the last page of a multi-page set it stays `undefined`.
- `from`/`to` derive from `page` × `perPage` on full pages, or count back from the total on the last page (`from = items - data.length + 1`, `to = items`).

Because `first`/`prev`/`next`/`last` are numbers, the `firstPageUrl`/`prevPageUrl`/`nextPageUrl`/`lastPageUrl` slots on `PaginatedCollection` stay `undefined`.

The `data` / `items` / `pages` key paths are configurable:

```typescript
provideQubee({
  driver: JSON_SERVER_DRIVER,
  response: {
    data: 'rows',
    lastPage: 'pageCount',
    total: 'totalRows'
  }
});
```

Defaults are encoded in `JsonServerResponseOptions`.
