---
slug: 3.8/drivers/feathers
title: "Feathers Driver"
sidebar:
  label: "Feathers"
---

Targets [FeathersJS](https://feathersjs.com/) — the realtime/REST application framework for Node.js, with the dollar-prefixed query syntax shared by all Feathers database adapters (`@feathersjs/knex`, `@feathersjs/mongodb`, `@feathersjs/memory`, …).

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.FEATHERS })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` (bare exact match) |
| Filters (multi-value) | `field[$in][0]=v1&field[$in][1]=v2` |
| Operator filters | `field[$op]=value` — see below |
| Sort | `$sort[field]=1` (ASC) / `$sort[field]=-1` (DESC) |
| Select | `$select[0]=col1&$select[1]=col2` |
| Pagination | `$limit=N&$skip=M` (offset-based, `skip = (page − 1) × limit`) |

The dollar-prefixed system params (`$limit`, `$skip`, `$sort`, `$select`) are fixed by the Feathers adapter-commons query parser and ignore `request` key overrides — the dollar prefix is how Feathers tells system params apart from filter fields.

Pagination is offset-based on the wire, but your state stays page-based: `setPage(3)` with `setLimit(10)` emits `$limit=10&$skip=20`.

## Operator filters

`FilterOperatorEnum` translates to Feathers' `$operator` syntax:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);            // age[$gte]=18
qb.addFilterOperator('age', FilterOperatorEnum.EQ, 18);             // age=18
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);          // id[$in][0]=1&id[$in][1]=2&id[$in][2]=3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');    // status[$ne]=draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');   // status[$nin][0]=a&status[$nin][1]=b
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);      // price[$gte]=10&price[$lte]=50
```

### Translation table

| `FilterOperatorEnum` | Feathers expression |
|---|---|
| `EQ` | bare `field=value` (no operator wrapper) |
| `GT` / `GTE` / `LT` / `LTE` | `[$gt]` / `[$gte]` / `[$lt]` / `[$lte]` |
| `IN` | `[$in][N]=` (one indexed param per value) |
| `BTW` | `[$gte]` + `[$lte]` pair on the same field (arity-checked) |
| `NOT` (single) | `[$ne]` |
| `NOT` (multi) | `[$nin][N]=` (one indexed param per value) |
| `CONTAINS` / `ILIKE` / `SW` | **unsupported** — LIKE-style matching is adapter-specific (`$like`, `$iLike`, `$regex`), not part of the common syntax; throws `UnsupportedFilterOperatorError` |
| `NULL` | **unsupported** — no null-check operator on the wire; throws `UnsupportedFilterOperatorError` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

Feathers' `$or` top-level operator has no fluent-method counterpart and is not exposed.

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`) — enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Bare exact match (single) or `[$in]` (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | `$sort[field]=1\|-1` map, multi-field |
| `setLimit` / `setPage` | ✓ | `$limit` + derived `$skip` |
| `addSelect` / `deleteSelect` | ✓ | `$select[N]=` indexed array |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | Relation loading is resolver-side in Feathers, no query param |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No global search param in the common syntax |

## Response shape

Feathers database adapters return an offset-based envelope when pagination is enabled on the service:

```json
{
  "total": 48,
  "limit": 10,
  "skip": 10,
  "data": [{ "id": 11, "text": "Hello" }]
}
```

`FeathersResponseStrategy` maps `total → total` and `limit → perPage`, then derives position arithmetically — the envelope carries no page number and no navigation URLs:

- `page` is `⌊skip ÷ limit⌋ + 1` (a zero or missing `limit` — e.g. a `$limit=0` count-only query — falls back to page 1).
- `lastPage` is `ceil(total ÷ limit)`.
- `from`/`to` are 1-indexed offsets from `skip` and the item count of the current page (`from = skip + 1`, `to = skip + data.length`); both stay `undefined` on an empty page.

The `firstPageUrl`/`prevPageUrl`/`nextPageUrl`/`lastPageUrl` slots on `PaginatedCollection` stay `undefined`.

The `data` / `total` / `limit` key paths are configurable (the `skip` key is fixed by the envelope):

```typescript
provideNgQubee({
  driver: DriverEnum.FEATHERS,
  response: {
    data: 'results',
    perPage: 'pageSize',
    total: 'count'
  }
});
```

Defaults are encoded in `FeathersResponseOptions`.
