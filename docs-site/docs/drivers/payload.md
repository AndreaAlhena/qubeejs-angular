---
sidebar_position: 17
title: Payload CMS
---

# Payload Driver

Targets [Payload](https://payloadcms.com/) — the TypeScript-native headless CMS / application framework, with its bracket-based `where` query syntax and the `mongoose-paginate-v2` response envelope.

## Configure

```typescript
import { PAYLOAD_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: PAYLOAD_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `where[field][equals]=value` |
| Filters (multi-value) | `where[field][in]=v1,v2` (CSV) |
| Operator filters | `where[field][op]=value` — see below |
| Sort | `sort=-createdAt,title` (CSV, `-` prefix = DESC) |
| Select | `select[col1]=true&select[col2]=true` |
| Pagination | `page=N&limit=M` |

The `where` / `sort` / `select` / `page` / `limit` keys are fixed by Payload's REST endpoints and ignore `request` key overrides. Simple filters and operator filters merge into a **single** `where[...]` block; both kinds can co-exist on the same field.

Relationship population is controlled by Payload's numeric `depth` param rather than a named-relation list, so `addIncludes` throws `UnsupportedIncludesError` — append `depth=N` through your HTTP layer when needed.

## Operator filters

`FilterOperatorEnum` translates to Payload's `where` operators:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('views', FilterOperatorEnum.GT, 100);            // where[views][greater_than]=100
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'hello');  // where[title][contains]=hello
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'hello');     // where[title][like]=hello
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);            // where[id][in]=1,2,3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');      // where[status][not_equals]=draft
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);        // where[price][greater_than_equal]=10&where[price][less_than_equal]=50
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);     // where[deletedAt][exists]=false
```

### Translation table

| `FilterOperatorEnum` | Payload operator |
|---|---|
| `EQ` | `equals` |
| `GT` / `GTE` / `LT` / `LTE` | `greater_than` / `greater_than_equal` / `less_than` / `less_than_equal` |
| `CONTAINS` | `contains` (case-insensitive substring) |
| `ILIKE` | `like` (case-insensitive, word-based) |
| `IN` | `in` (CSV) |
| `BTW` | `greater_than_equal` + `less_than_equal` pair (arity-checked) |
| `NOT` (single) | `not_equals` |
| `NOT` (multi) | `not_in` (CSV) |
| `NULL` | `exists` with **inverted** boolean (`true` → `exists=false` ⇔ IS NULL); arity/type-checked |
| `SW` | **unsupported** — no starts-with operator; throws `UnsupportedFilterOperatorError` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

Payload's `near` / `within` / `intersects` geo operators and `all` have no `FilterOperatorEnum` counterpart and are not exposed.

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`); `NULL` requires exactly **1 boolean** — both enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | `equals` (single) or `in` CSV (multi) inside the `where` block |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `sort=` with `-` prefix for DESC |
| `setLimit` / `setPage` | ✓ | `page` + `limit` |
| `addSelect` / `deleteSelect` | ✓ | `select[col]=true` flags (dotted names pass through for nested selection) |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | Population is depth-based (`depth=N`), not a named-relation list |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No global search param — use a `CONTAINS`/`ILIKE` operator filter instead |

## Response shape

Payload emits the `mongoose-paginate-v2` envelope — flat, with **page numbers** (not URLs) for navigation:

```json
{
  "docs": [{ "id": "abc123", "title": "Hello" }],
  "totalDocs": 48,
  "limit": 10,
  "totalPages": 5,
  "page": 2,
  "pagingCounter": 11,
  "hasPrevPage": true,
  "hasNextPage": true,
  "prevPage": 1,
  "nextPage": 3
}
```

`PayloadResponseStrategy` maps `docs → data`, `totalDocs → total`, `limit → perPage`, `totalPages → lastPage`, `page → page` — and `pagingCounter`, the 1-indexed offset of the first doc on the page, straight onto `from`; `to` is computed from `page` × `limit` (clamped to the total). Because `prevPage`/`nextPage` are numbers, the URL slots on `PaginatedCollection` stay `undefined`.

Since the envelope comes from `mongoose-paginate-v2`, this driver also fits any Express/Mongoose backend using that plugin — not just Payload.

All key paths are configurable (dot notation supported):

```typescript
provideQubee({
  driver: PAYLOAD_DRIVER,
  response: {
    data: 'results',
    total: 'count'
  }
});
```

Defaults are encoded in `PayloadResponseOptions`.
