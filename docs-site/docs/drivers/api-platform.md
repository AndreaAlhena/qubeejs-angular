---
sidebar_position: 14
title: API Platform (Symfony)
---

# API Platform Driver

Targets [API Platform](https://api-platform.com/) — the leading REST/GraphQL framework for PHP/Symfony, with bracket-based filter syntax and the Hydra/JSON-LD collection envelope.

## Configure

```typescript
import { API_PLATFORM_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: API_PLATFORM_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` (exact) |
| Filters (multi-value) | `field[]=v1&field[]=v2` (array syntax, OR) |
| Filters (relation) | dot paths pass through: `author.name=John` |
| Operator filters | bracket syntax `field[op]=value` — see below |
| Sort | `order[name]=desc&order[id]=asc` (one param per rule) |
| Pagination | `page=N&itemsPerPage=M` |

`page` honours `QubeeConfig.request` overrides (its default matches the wire format); `order` and `itemsPerPage` are fixed API Platform conventions.

:::note
API Platform filters are **opt-in server-side** — each property only accepts the syntax whose filter (`SearchFilter`, `RangeFilter`, `ExistsFilter`, …) is declared on the resource. The driver emits the standard form; the server must have the matching filter enabled.
:::

## Operator filters

`FilterOperatorEnum` translates to API Platform's filter syntax:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('price', FilterOperatorEnum.GT, 100);            // price[gt]=100
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // price[between]=10..50
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'ring');   // title[partial]=ring
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'Ring');      // title[ipartial]=Ring
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'The');          // title[start]=The
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // id[]=1&id[]=2&id[]=3
qb.addFilterOperator('author', FilterOperatorEnum.NULL, true);        // author[exists]=false
qb.addFilterOperator('author', FilterOperatorEnum.NULL, false);       // author[exists]=true
```

### Translation table

| `FilterOperatorEnum` | API Platform syntax |
|---|---|
| `EQ` | bare exact match (`field=value`) |
| `GT` / `GTE` / `LT` / `LTE` | RangeFilter `field[gt]=` / `[gte]` / `[lt]` / `[lte]` |
| `BTW` | RangeFilter `field[between]=min..max` (arity-checked) |
| `CONTAINS` | SearchFilter `field[partial]=` |
| `ILIKE` | SearchFilter `field[ipartial]=` (case-insensitive) |
| `SW` | SearchFilter `field[start]=` |
| `IN` | array syntax `field[]=v1&field[]=v2` |
| `NULL` (`true`) | ExistsFilter `field[exists]=false` — **inverted**: exists=false ⇔ IS NULL |
| `NULL` (`false`) | ExistsFilter `field[exists]=true` |
| `NOT` | **unsupported** — no negation filter in core; throws `UnsupportedFilterOperatorError` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`min`, `max`).
- `NULL` requires exactly **1 boolean value**.

### Date filtering

API Platform's DateFilter (`after` / `before` / `strictly_after` / `strictly_before`) has no `FilterOperatorEnum` counterpart, but the bracket key passes through `addFilter` directly:

```typescript
qb.addFilter('createdAt[after]', '2023-01-01');   // createdAt[after]=2023-01-01
```

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Exact match (single) or array-syntax OR (multi); relation dot paths pass through |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | One `order[field]=dir` param per rule |
| `setLimit` / `setPage` | ✓ | `page` + `itemsPerPage` |
| `addSelect` / `deleteSelect` | ✗ | No column-projection parameter (serialization groups are server-side) |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | Relations embed via serialization groups, not a query param |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No standard global search parameter |

## Response shape

API Platform's default Hydra/JSON-LD collection envelope:

```json
{
  "@context": "/contexts/Book",
  "@type": "hydra:Collection",
  "hydra:totalItems": 48,
  "hydra:member": [{ "id": 21, "title": "The Ring" }],
  "hydra:view": {
    "@id": "/books?page=3&itemsPerPage=10",
    "hydra:first": "/books?page=1",
    "hydra:previous": "/books?page=2",
    "hydra:next": "/books?page=4",
    "hydra:last": "/books?page=5"
  }
}
```

The body names no current-page or page-size field, so `ApiPlatformResponseStrategy` **derives** them from the `hydra:view` URLs:

- `page` from the `page` param of the view's `@id` (no view → page 1).
- `perPage` from the `itemsPerPage` param of the view's `@id` — echoed whenever the request set it, which this driver always does — falling back to the item count of a page that has a `hydra:next` successor.
- `lastPage` from the `page` param of `hydra:last`, falling back to `ceil(total ÷ perPage)`.

Relative links (`/books?page=4`) are handled and surfaced as-is on the collection's URL slots. The Hydra key paths are configurable (dot notation supported — the colon-keys are dot-free segments):

```typescript
provideQubee({
  driver: API_PLATFORM_DRIVER,
  response: {
    data: 'member',
    total: 'totalItems'
  }
});
```

:::note
JSON:API and HAL serialization formats are out of scope for this driver — for API Platform's JSON:API output, use the [JSON:API driver](./json-api.md) instead.
:::

Defaults are encoded in `ApiPlatformResponseOptions`.
