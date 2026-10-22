---
sidebar_position: 16
title: PocketBase
---

# PocketBase Driver

Targets [PocketBase](https://pocketbase.io/) — the open-source single-binary backend (SQLite + realtime + auth), with its expression-language `filter` parameter and page-based pagination.

## Configure

```typescript
import { POCKETBASE_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: POCKETBASE_DRIVER })]
});
```

Point `setBaseUrl` at the records endpoint root (e.g. `https://pb.example.com/api/collections`) and use the collection name + `/records` as the resource, or bake the full path into your HTTP layer.

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `filter=(field='value')` (strings quoted, numbers/booleans bare) |
| Filters (multi-value) | `filter=((field='v1' \|\| field='v2'))` (OR group) |
| Operator filters | expression terms inside `filter=(...)` — see below |
| Sort | `sort=-created,title` (CSV, `-` prefix = DESC) |
| Select | `fields=id,title` (CSV) |
| Includes | `expand=author,comments` (CSV) |
| Pagination | `page=N&perPage=M` |

The `page` / `perPage` / `sort` / `filter` / `expand` / `fields` keys are fixed by the PocketBase records API and ignore `request` key overrides. Simple filters and operator filters merge into a **single** `filter=(...)` expression, AND-joined.

String literals are single-quoted with embedded quotes backslash-escaped (`name='O\'Brien'`).

## Operator filters

`FilterOperatorEnum` translates to PocketBase's expression operators:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('views', FilterOperatorEnum.GT, 100);            // filter=(views>100)
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'hello');  // filter=(title~'hello')
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');        // filter=(title~'Intro%')
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // filter=((id=1 || id=2 || id=3))
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');      // filter=(status!='draft')
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // filter=((price>=10 && price<=50))
qb.addFilterOperator('deleted', FilterOperatorEnum.NULL, true);       // filter=(deleted=null)
```

### Translation table

| `FilterOperatorEnum` | PocketBase expression |
|---|---|
| `EQ` | `field='value'` |
| `GT` / `GTE` / `LT` / `LTE` | `>` / `>=` / `<` / `<=` |
| `CONTAINS` / `ILIKE` | `field~'value'` (PocketBase's `~` is case-insensitive and auto-wraps in `%...%`) |
| `SW` | `field~'value%'` (explicit trailing wildcard disables the auto-wrap) |
| `IN` | OR group `(field='v1' \|\| field='v2')` |
| `BTW` | AND group `(field>=min && field<=max)` (arity-checked) |
| `NOT` (single) | `field!='value'` |
| `NOT` (multi) | AND group of `!=` terms |
| `NULL` | `field=null` (value `true`) / `field!=null` (value `false`); arity/type-checked |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

PocketBase's `?=` / `?~` any-of relation operators and `!~` (not-like) have no `FilterOperatorEnum` counterpart and are not exposed.

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`); `NULL` requires exactly **1 boolean** — both enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Expression terms inside the single `filter=(...)` param |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `sort=` with `-` prefix for DESC |
| `setLimit` / `setPage` | ✓ | `page` + `perPage` |
| `addSelect` / `deleteSelect` | ✓ | `fields=` CSV |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✓ | `expand=` CSV (dotted names pass through for nested expansion) |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No global search param — use a `CONTAINS` operator filter instead |

## Response shape

PocketBase records-list responses are flat:

```json
{
  "page": 1,
  "perPage": 30,
  "totalItems": 48,
  "totalPages": 2,
  "items": [{ "id": "abc123", "title": "Hello" }]
}
```

`PocketbaseResponseStrategy` maps `items → data`, `totalItems → total`, `totalPages → lastPage`, `page → page`, `perPage → perPage`; `from`/`to` are computed from `page` × `perPage` (clamped to the total on the last page). The envelope carries no navigation links, so the URL slots on `PaginatedCollection` stay `undefined`.

Note: with `skipTotal=1` (a server-side optimisation this driver does not emit), PocketBase reports `totalItems`/`totalPages` as `-1`.

All key paths are configurable (dot notation supported):

```typescript
provideQubee({
  driver: POCKETBASE_DRIVER,
  response: {
    data: 'records',
    total: 'meta.count'
  }
});
```

Defaults are encoded in `PocketbaseResponseOptions`.
