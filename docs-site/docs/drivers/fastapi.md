---
sidebar_position: 20
title: FastAPI
---

# FastAPI Driver

Targets [FastAPI](https://fastapi.tiangolo.com/) list endpoints built on the two libraries most of them use: [fastapi-filter](https://github.com/arthurio/fastapi-filter) (its SQLAlchemy backend) reads the query, and [fastapi-pagination](https://github.com/uriyyo/fastapi-pagination)'s `Page` shapes the response.

## Configure

```typescript
import { FASTAPI_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: FASTAPI_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` |
| Filters (multi-value) | `field__in=v1,v2` (one comma-separated param) |
| Operator filters | `field__operator=value` — see below |
| Sort | `order_by=-created_at,title` (CSV, `-` prefix = DESC) |
| Search | `search=term` |
| Pagination | `page=N&size=M` |

`order_by` and `size` are the libraries' own names and ignore `request` key overrides; `page` and `search` follow them. Several values travel as one comma-separated `__in` param — the only list form fastapi-filter reads — so a value that itself holds a comma is split in two.

A few FastAPI-specific constraints to keep in mind:

- **Declared fields only**: every condition must be a field of the server's `Filter` class. FastAPI ignores a query parameter nothing declares, so an undeclared condition is dropped without an error. `status` and `status__in` are two fields: one value is sent as `status=…`, several as `status__in=…`.
- **Sorting and search need their own fields**: `order_by` takes effect through the endpoint's `.sort()` call, and a `search` field needs `search_model_fields` — the columns it matches with `ilike` — or a search is a server error.
- **Attribute names**: conditions and sorts name the model's own attributes, in snake_case — `created_at`, not `createdAt`. A condition on a related model's field carries its prefix (`author__name`) when the `Filter` nests one with `with_prefix('author', …)`; sorts cannot reach a related model.
- **No repeated sort field**: sorting on a field the model lacks is a 422, and so is naming a field twice, so a repeated sort field is sent once, with its first direction — `addSort('title', DESC).addSort('title', ASC)` emits `order_by=-title`.

:::caution Page size cap
`Page` caps `size` at 100, and a larger page size is answered with a 422, not trimmed — stay at `setLimit(100)` or below, or raise the cap on the server with `CustomizedPage[Page[T], UseParamsFields(size=Query(50, ge=1, le=500))]`.
:::

## Operator filters

`FilterOperatorEnum` translates to fastapi-filter operator suffixes:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('views', FilterOperatorEnum.GTE, 100);              // views__gte=100
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'rails');        // title__ilike=%25rails%25
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'rai');             // title__like=rai%25
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);              // id__in=1,2,3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');         // status__neq=draft
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);           // price__gte=10&price__lte=50
qb.addFilterOperator('deleted_at', FilterOperatorEnum.NULL, true);       // deleted_at__isnull=true
```

### Translation table

| `FilterOperatorEnum` | fastapi-filter operator |
|---|---|
| `EQ` | no suffix (`field=value`) |
| `GT` / `GTE` / `LT` / `LTE` | `__gt` / `__gte` / `__lt` / `__lte` |
| `CONTAINS` | `__like=%v%` (case-sensitive on PostgreSQL) |
| `ILIKE` | `__ilike=%v%` (case-insensitive) |
| `SW` | `__like=v%` |
| `IN` | `__in` (CSV) |
| `BTW` | `__gte` + `__lte` pair (arity-checked) |
| `NOT` (single) | `__neq` |
| `NOT` (multi) | `__not_in` (CSV) |
| `NULL` | `__isnull=true` (IS NULL) / `__isnull=false` (IS NOT NULL); arity/type-checked |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

fastapi-filter expects the client to send the `like`/`ilike` wildcards, so `CONTAINS`, `ILIKE` and `SW` add them, percent-encoded as `%25`. A `%` or `_` inside the value itself is a wildcard too — fastapi-filter has no escape. `NOT` maps to `__neq` because fastapi-filter's own `__not` renders `IS NOT`, which is not inequality.

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`); `NULL` requires exactly **1 boolean** — both enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

### Other fastapi-filter backends

The driver targets the SQLAlchemy backend. On the Beanie backend, `NOT` works, but `like` and `ilike` become a regular expression that keeps the `%` as a literal character, so `CONTAINS`, `ILIKE` and `SW` match nothing. The MongoEngine backend passes operators straight to MongoEngine, which has no `neq`, `not_in`, `like` or `ilike`, so `NOT`, `CONTAINS`, `ILIKE` and `SW` fail there.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Bare equality (single) or CSV `__in` (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `order_by=` with `-` prefix for DESC; a repeated field is sent once |
| `setLimit` / `setPage` | ✓ | `page` + `size` (`Page` caps `size` at 100) |
| `addSelect` / `deleteSelect` | ✗ | No field selection |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | No includes |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✓ | `search=term` — an OR of `ilike` across the server's `search_model_fields` |

## Response shape

fastapi-pagination's `Page` emits a flat envelope with **page numbers**:

```json
{
  "items": [{ "id": 11, "title": "Hello" }],
  "total": 95,
  "page": 2,
  "size": 10,
  "pages": 10
}
```

`FastapiResponseStrategy` maps `items → data`, `total → total`, `page → page`, `size → perPage` and `pages → lastPage`. `from`/`to` are derived from the rows actually returned — `page` × `size` places the first row and the row count the last — so a short last page ends at its last row, and an empty page has neither.

A plain `Page` has no navigation links, so the URL slots on `PaginatedCollection` stay `undefined`. `fastapi_pagination.links.Page` adds a `links` block whose `first`, `prev`, `next` and `last` are read with the same defaults.

| On the server | Here |
|---|---|
| `Page`, `fastapi_pagination.links.Page` | Read without configuration; the `links` block fills the navigation URLs |
| `UseIncludeTotal(False)` | The `null` total and page count read as unknown; `links.last`, which then always points at page 1, is dropped |
| `UseFieldsAliases(items="content")` | `response: { data: 'content' }` |
| `page` renamed through `UseParamsFields` | `request: { page: 'p' }`; `size` is fixed |
| `LimitOffsetPage`, `CursorPage` | Not supported |

An empty result reports `pages: 0`; the last page is clamped to 1, so a page count from an earlier, wider query does not linger.

All key paths are configurable (dot notation supported):

```typescript
provideQubee({
  driver: FASTAPI_DRIVER,
  response: {
    data: 'content'
  }
});
```

Defaults are encoded in `FastapiResponseOptions`.
