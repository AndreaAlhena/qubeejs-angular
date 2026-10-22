---
slug: 3.8/drivers/sieve
title: "Sieve Driver"
sidebar:
  label: "Sieve (.NET)"
---

Targets [Sieve](https://github.com/Biarity/Sieve) — the popular filtering, sorting, and pagination library for ASP.NET Core, with its compact single-parameter expression syntax.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.SIEVE })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `filters=field==value` |
| Filters (multi-value) | `filters=field==v1\|v2` (value-level pipe OR) |
| Filters (combined) | comma = AND: `filters=status==active,price>=100` |
| Operator filters | full `FilterOperatorEnum` mapping — see below |
| Sort | `sorts=likeCount,-createdDate` (CSV, `-` prefix = DESC) |
| Pagination | `page=N&pageSize=N` |

All filter terms — simple and operator alike — merge into **one** `filters=` parameter, AND-joined with commas.

## Operator filters

`FilterOperatorEnum` translates to Sieve's inline operator symbols:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('likeCount', FilterOperatorEnum.GTE, 4);        // likeCount>=4
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'world'); // title@=world
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'World');    // title@=*World
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');       // title_=Intro
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);           // id==1|2|3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');     // status!=draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');    // status!=a,status!=b
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);    // deletedAt==null
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);   // deletedAt!=null
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);       // price>=10,price<=50
```

### Translation table

| `FilterOperatorEnum` | Sieve expression |
|---|---|
| `EQ` | `==` |
| `GT` / `GTE` / `LT` / `LTE` | `>` / `>=` / `<` / `<=` |
| `CONTAINS` | `@=` |
| `ILIKE` | `@=*` (case-insensitive contains) |
| `IN` | `==` with value-level pipe OR (`field==v1\|v2`) |
| `SW` | `_=` (starts with) |
| `BTW` | two AND-ed terms (`field>=min,field<=max`, arity-checked) |
| `NOT` (single) | `!=` |
| `NOT` (multi) | one `!=` term per value, AND-ed |
| `NULL` (`true`) | `==null` |
| `NULL` (`false`) | `!=null` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`min`, `max`).
- `NULL` requires exactly **1 boolean value** (`true` → `==null`, `false` → `!=null`).

Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Folds to `==` (single) or value-level pipe OR (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `sorts=` with `-` prefix for DESC |
| `setLimit` / `setPage` | ✓ | `page` + `pageSize` |
| `addSelect` / `deleteSelect` | ✗ | Sieve has no column-projection parameter |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | No relation-loading parameter |
| `addEmbedded` / `deleteEmbedded` | ✗ | PostgREST-only — throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No global search — use `CONTAINS` / `ILIKE` operator filters for partial matches |

## Response shape

Sieve does **not** define a response envelope — it returns an `IQueryable` your ASP.NET controller wraps in a paging DTO. The driver ships defaults for the common hand-rolled `PagedResult<T>` shape:

```json
{
  "data": [{ "id": 1, "title": "Hello" }],
  "page": 2,
  "pageSize": 10,
  "total": 48,
  "totalPages": 5
}
```

`SieveResponseStrategy` reads `{ data, page, pageSize, total, totalPages }` and computes `from`/`to` from page × pageSize. The envelope key paths are fully configurable (dot notation supported), so any wrapper your backend emits can be mapped without subclassing:

```typescript
provideNgQubee({
  driver: DriverEnum.SIEVE,
  response: {
    currentPage: 'meta.page',
    data: 'items',
    lastPage: 'meta.pages',
    perPage: 'meta.size',
    total: 'meta.count'
  }
});
```

Defaults are encoded in `SieveResponseOptions`.
