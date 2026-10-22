---
slug: 3.8/drivers/strapi
title: "Strapi Driver"
sidebar:
  label: "Strapi"
---

Targets [Strapi](https://strapi.io/) v4 / v5 — the leading open-source headless CMS for Node.js.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.STRAPI })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `filters[field][$eq]=value` |
| Filters (multi-value) | `filters[field][$in][0]=v1&filters[field][$in][1]=v2` |
| Operator filters | full `FilterOperatorEnum` mapping — see below |
| Sort | `sort[0]=field:asc&sort[1]=field:desc` |
| Flat field selection | `fields[0]=col1&fields[1]=col2` |
| Populate | `populate[0]=relation&populate[1]=other` |
| Pagination | `pagination[page]=N&pagination[pageSize]=N` |

## Operator filters

`FilterOperatorEnum` translates to Strapi's `$`-prefixed operators:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('rating', FilterOperatorEnum.GTE, 4);            // filters[rating][$gte]=4
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'world');  // filters[title][$contains]=world
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'World');     // filters[title][$containsi]=World
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');        // filters[title][$startsWith]=Intro
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // filters[id][$in][0..2]=...
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');      // filters[status][$ne]=draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');     // filters[status][$notIn][0..1]=...
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);     // filters[deletedAt][$null]=true
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);    // filters[deletedAt][$notNull]=true
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // filters[price][$between][0]=10&[1]=50
```

### Translation table

| `FilterOperatorEnum` | Strapi operator |
|---|---|
| `EQ` | `$eq` |
| `GT` / `GTE` / `LT` / `LTE` | `$gt` / `$gte` / `$lt` / `$lte` |
| `CONTAINS` | `$contains` |
| `ILIKE` | `$containsi` (case-insensitive contains) |
| `IN` | `$in` |
| `SW` | `$startsWith` |
| `BTW` | `$between` (arity-checked, expands to a 2-element array) |
| `NOT` (single) | `$ne` |
| `NOT` (multi) | `$notIn` |
| `NULL` (`true`) | `$null=true` |
| `NULL` (`false`) | `$notNull=true` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`[min, max]`).
- `NULL` requires exactly **1 boolean value** (`true` → `$null=true`, `false` → `$notNull=true`).

Other operators leave shape validation to the server.

## Combining simple and operator filters

Both kinds emit into a single `filters[...]` block, so you can combine them on the same field:

```typescript
qb.addFilter('rating', 5);
qb.addFilterOperator('rating', FilterOperatorEnum.GTE, 4);
// → filters[rating][$eq]=5&filters[rating][$gte]=4
```

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Folds to `$eq` (single) or `$in` (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | Array notation `sort[N]=field:dir` |
| `addSelect` / `deleteSelect` | ✓ | Emitted as `fields[N]=col` (Strapi reuses the `fields` key for flat projection) |
| `addIncludes` / `deleteIncludes` | ✓ | Emitted as `populate[N]=relation` |
| `addEmbedded` / `deleteEmbedded` | ✗ | PostgREST-only — throws `UnsupportedEmbeddedError` |
| `setLimit` / `setPage` | ✓ | `pageSize` mirrors `limit`; page-based mode only |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | Strapi has no per-model field selection on the main query path |
| `setSearch` / `deleteSearch` | ✗ | Use `addFilterOperator(col, FilterOperatorEnum.CONTAINS, term)` (or `ILIKE` for case-insensitive) |

## Response shape

```json
{
  "data": [
    { "id": 1, "documentId": "abc", "title": "Hello" }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 48
    }
  }
}
```

`StrapiResponseStrategy` reads `meta.pagination.{page,pageSize,pageCount,total}` and computes `from`/`to` from `(page - 1) * pageSize + 1` and `min(page * pageSize, total)`. Strapi does not include navigation links in the envelope, so `firstPageUrl` / `prevPageUrl` / `nextPageUrl` / `lastPageUrl` resolve to `undefined` unless you override their paths via `IConfig.response`.

## Customising response paths

```typescript
provideNgQubee({
  driver: DriverEnum.STRAPI,
  response: {
    total: 'meta.totalCount'
  }
});
```

Defaults are encoded in `StrapiResponseOptions`.
