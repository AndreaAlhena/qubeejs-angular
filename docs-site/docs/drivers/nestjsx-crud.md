---
sidebar_position: 8
title: '@nestjsx/crud'
---

# @nestjsx/crud Driver

Targets [@nestjsx/crud](https://github.com/nestjsx/crud) — the popular CRUD framework for NestJS with a pipe-delimited query convention.

## Configure

```typescript
import { NESTJSX_CRUD_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: NESTJSX_CRUD_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `filter=field\|\|$eq\|\|value` |
| Filters (multi-value) | `filter=field\|\|$in\|\|v1,v2` |
| Operator filters | full `FilterOperatorEnum` mapping — see below |
| Sort | `sort=field,ASC&sort=other,DESC` (repeatable) |
| Flat field selection | `fields=col1,col2` |
| Joins | `join=relation&join=other` (repeatable) |
| Pagination | `page=N&limit=N` |

## Operator filters

`FilterOperatorEnum` translates to @nestjsx/crud's `$`-prefixed condition operators:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('rating', FilterOperatorEnum.GTE, 4);            // filter=rating||$gte||4
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'world');  // filter=title||$cont||world
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'World');     // filter=title||$contL||World
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');        // filter=title||$starts||Intro
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // filter=id||$in||1,2,3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');      // filter=status||$ne||draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');     // filter=status||$notin||a,b
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);     // filter=deletedAt||$isnull
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);    // filter=deletedAt||$notnull
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // filter=price||$between||10,50
```

### Translation table

| `FilterOperatorEnum` | @nestjsx/crud operator |
|---|---|
| `EQ` | `$eq` |
| `GT` / `GTE` / `LT` / `LTE` | `$gt` / `$gte` / `$lt` / `$lte` |
| `CONTAINS` | `$cont` |
| `ILIKE` | `$contL` (case-insensitive contains) |
| `IN` | `$in` |
| `SW` | `$starts` |
| `BTW` | `$between` (arity-checked, emits `min,max`) |
| `NOT` (single) | `$ne` |
| `NOT` (multi) | `$notin` |
| `NULL` (`true`) | `$isnull` (no value segment) |
| `NULL` (`false`) | `$notnull` (no value segment) |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`min,max`).
- `NULL` requires exactly **1 boolean value** (`true` → `$isnull`, `false` → `$notnull`).

Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Folds to `$eq` (single) or `$in` (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | Repeatable `sort=field,ASC` params, uppercase direction |
| `addSelect` / `deleteSelect` | ✓ | Emitted as `fields=col1,col2` (flat column projection) |
| `addIncludes` / `deleteIncludes` | ✓ | Emitted as repeatable `join=relation` params |
| `addEmbedded` / `deleteEmbedded` | ✗ | PostgREST-only — throws `UnsupportedEmbeddedError` |
| `setLimit` / `setPage` | ✓ | `page` + `limit`, page-based mode |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | @nestjsx/crud has no per-model field selection (per-relation projection via `join=rel\|\|f1,f2` is out of scope) |
| `setSearch` / `deleteSearch` | ✗ | The `s={...}` parameter is JSON-shaped, not a plain term — use operator filters instead |

## Response shape

```json
{
  "data": [
    { "id": 1, "name": "John" }
  ],
  "count": 10,
  "total": 48,
  "page": 2,
  "pageCount": 5
}
```

`NestjsxCrudResponseStrategy` reads the flat `{ data, count, total, page, pageCount }` envelope and computes `from`/`to` from `(page - 1) * count + 1` and `min(page * count, total)`. The envelope carries no navigation links, so `firstPageUrl` / `prevPageUrl` / `nextPageUrl` / `lastPageUrl` resolve to `undefined` unless you override their paths via `QubeeConfig.response`.

:::note
`count` is the number of entities **on the current page**, not the requested page size — on a partial last page the derived `from`/`to` underestimate. Compute exact indices from your requested limit if you need them on the last page.
:::

## Customising response paths

```typescript
provideQubee({
  driver: NESTJSX_CRUD_DRIVER,
  response: {
    data: 'items',
    total: 'totalCount'
  }
});
```

Defaults are encoded in `NestjsxCrudResponseOptions`.
