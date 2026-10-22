---
slug: 3.8/drivers/directus
title: "Directus Driver"
sidebar:
  label: "Directus"
---

Targets [Directus](https://directus.io/) — the popular open-source headless CMS and data platform, with its underscore-prefixed operators inside a nested bracket filter syntax.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.DIRECTUS })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `filter[field][_eq]=value` |
| Filters (multi-value) | `filter[field][_in]=v1,v2` (CSV) |
| Operator filters | `filter[field][_op]=value` — full `FilterOperatorEnum` mapping below |
| Sort | `sort=likeCount,-createdDate` (CSV, `-` prefix = DESC) |
| Fields / relations | one `fields=` CSV: `fields=title,author.id,comments.*` |
| Search | `search=term` (global full-text search) |
| Metadata | `meta=total_count,filter_count` (always emitted) |
| Pagination | `limit=N&page=N` (1-indexed page) |

The `filter` / `sort` / `fields` / `search` / `limit` / `page` keys honour `IConfig.request` overrides (their defaults already match the Directus wire format); `meta` is fixed.

:::note
`meta=total_count,filter_count` is always emitted: the [response strategy](#response-shape) reads the totals from `meta`, which Directus only includes when the request asks for it.
:::

## Operator filters

`FilterOperatorEnum` translates to Directus' underscore operators:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('likeCount', FilterOperatorEnum.GTE, 4);        // filter[likeCount][_gte]=4
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'world'); // filter[title][_contains]=world
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'World');    // filter[title][_icontains]=World
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');       // filter[title][_starts_with]=Intro
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);           // filter[id][_in]=1,2,3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');     // filter[status][_neq]=draft
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');    // filter[status][_nin]=a,b
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);    // filter[deletedAt][_null]=true
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);   // filter[deletedAt][_nnull]=true
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);       // filter[price][_between]=10,50
```

### Translation table

| `FilterOperatorEnum` | Directus operator |
|---|---|
| `EQ` | `_eq` |
| `GT` / `GTE` / `LT` / `LTE` | `_gt` / `_gte` / `_lt` / `_lte` |
| `CONTAINS` | `_contains` |
| `ILIKE` | `_icontains` (case-insensitive contains) |
| `IN` | `_in` (CSV) |
| `SW` | `_starts_with` |
| `BTW` | `_between` with `min,max` (arity-checked) |
| `NOT` (single) | `_neq` |
| `NOT` (multi) | `_nin` (CSV) |
| `NULL` (`true`) | `_null=true` |
| `NULL` (`false`) | `_nnull=true` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`min`, `max`).
- `NULL` requires exactly **1 boolean value** (`true` → `_null=true`, `false` → `_nnull=true`).

Other operators leave shape validation to the server.

## Fields and relations

Directus has no standalone include parameter — relational data travels through dot paths in the single `fields=` CSV, so `addSelect`, `addIncludes`, and `addEmbedded` all fold into it:

```typescript
qb.addSelect('title');                    // fields=title
qb.addIncludes('author');                 // fields=*,author.*
qb.addEmbedded('author', 'id', 'name');   // fields=*,author.id,author.name

qb.addSelect('title').addEmbedded('author', 'id');
// → fields=title,author.id
```

With relations but no flat `addSelect`, the flat part defaults to `*` so the base item's columns stay in the projection. A relation present in both `addIncludes` and `addEmbedded` folds into the embedded fragment, which carries the column projection. Directus' `deep[...]` relational query options and nested relation filtering are out of scope.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Folds to `_eq` (single) or `_in` CSV (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | CSV `sort=` with `-` prefix for DESC |
| `setLimit` / `setPage` | ✓ | `limit` + `page` (1-indexed) |
| `addSelect` / `deleteSelect` | ✓ | Flat columns in the `fields=` CSV |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection — use dot paths via `addEmbedded` |
| `addIncludes` / `deleteIncludes` | ✓ | `rel.*` entries in the `fields=` CSV |
| `addEmbedded` / `deleteEmbedded` | ✓ | `rel.col` dot-projected entries in the `fields=` CSV |
| `setSearch` / `deleteSearch` | ✓ | `search=term` global search |

## Response shape

```json
{
  "data": [{ "id": 1, "title": "Hello" }],
  "meta": { "total_count": 48, "filter_count": 12 }
}
```

`DirectusResponseStrategy` reads `data` and defaults `total` to **`meta.filter_count`** — the count matching the current filter, which is the relevant total for paging a filtered collection. Point the path at `meta.total_count` if you want the unfiltered collection size:

```typescript
provideNgQubee({
  driver: DriverEnum.DIRECTUS,
  response: { total: 'meta.total_count' }
});
```

:::caution
The Directus envelope carries **no current-page or page-size field**, so `page` falls back to **1** (guaranteed correct only for single-page results) and `perPage` stays `undefined` — track the requested page in your own state for multi-page UIs. `lastPage`/`from`/`to` resolve only on a response that provably holds the whole filtered set, or when you point their paths at a custom wrapper that includes paging fields (dot notation supported).
:::

Defaults are encoded in `DirectusResponseOptions`.
