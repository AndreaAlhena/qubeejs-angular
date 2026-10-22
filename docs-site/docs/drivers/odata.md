---
sidebar_position: 11
title: OData
---

# OData Driver

Targets [OData v4](https://www.odata.org/) — the OASIS-standard query protocol primarily adopted in the Microsoft/.NET ecosystem (ASP.NET Core OData, SAP, Microsoft Graph), with implementations in Java, Node.js, and others.

## Configure

```typescript
import { ODATA_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: ODATA_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `$filter=field eq 'value'` |
| Filters (multi-value) | `$filter=field in ('v1','v2')` |
| Filters (combined) | ` and `-joined: `$filter=status eq 'active' and price ge 100` |
| Operator filters | full `FilterOperatorEnum` mapping — see below |
| Sort | `$orderby=likeCount asc,createdDate desc` |
| Select | `$select=col1,col2` |
| Expand | `$expand=rel,other($select=col1,col2)` |
| Search | `$search=term` |
| Pagination | `$count=true&$top=N&$skip=M` (`$skip` omitted on page 1) |

All filter terms — simple and operator alike — merge into **one** `$filter=` parameter, joined with ` and `. The `$`-prefixed system query option names are fixed by the OData specification and ignore any `request` key overrides.

String literals are single-quoted with embedded quotes doubled (`name eq 'O''Brien'`); numbers and booleans are emitted bare.

:::note
`$count=true` is always emitted: the [response strategy](#response-shape) reads the total from `@odata.count`, which servers only include when the request asks for it.
:::

## Operator filters

`FilterOperatorEnum` translates to OData's expression language:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('likeCount', FilterOperatorEnum.GTE, 4);        // likeCount ge 4
qb.addFilterOperator('title', FilterOperatorEnum.CONTAINS, 'world'); // contains(title,'world')
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'World');    // contains(tolower(title),tolower('World'))
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'Intro');       // startswith(title,'Intro')
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);           // id in (1,2,3)
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');     // status ne 'draft'
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'a', 'b');    // status ne 'a' and status ne 'b'
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);    // deletedAt eq null
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);   // deletedAt ne null
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);       // price ge 10 and price le 50
```

### Translation table

| `FilterOperatorEnum` | OData expression |
|---|---|
| `EQ` | `eq` |
| `GT` / `GTE` / `LT` / `LTE` | `gt` / `ge` / `lt` / `le` |
| `CONTAINS` | `contains(field,'val')` |
| `ILIKE` | `contains(tolower(field),tolower('val'))` (case-insensitive contains) |
| `IN` | `field in ('v1','v2')` (OData v4.01 list operator) |
| `SW` | `startswith(field,'val')` |
| `BTW` | two AND-ed terms (`field ge min and field le max`, arity-checked) |
| `NOT` (single) | `ne` |
| `NOT` (multi) | one `ne` term per value, AND-ed |
| `NULL` (`true`) | `field eq null` |
| `NULL` (`false`) | `field ne null` |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`min`, `max`).
- `NULL` requires exactly **1 boolean value** (`true` → `eq null`, `false` → `ne null`).

Other operators leave shape validation to the server.

## Expanding relations

Both `addIncludes` and `addEmbedded` fold into the single `$expand=` parameter:

```typescript
qb.addIncludes('orders', 'profile');     // $expand=orders,profile
qb.addEmbedded('orders', 'id', 'amount'); // $expand=orders($select=id,amount)
```

A relation present in both folds into the embedded fragment, which carries the column projection.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Folds to `eq` (single) or `in` list (multi) |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | `$orderby=field asc,other desc` |
| `setLimit` / `setPage` | ✓ | `$top` + `$skip` (derived from page) |
| `addSelect` / `deleteSelect` | ✓ | `$select=col1,col2` |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✓ | Bare `$expand=rel` fragments |
| `addEmbedded` / `deleteEmbedded` | ✓ | `$expand=rel($select=col1,col2)` inline projection |
| `setSearch` / `deleteSearch` | ✓ | `$search=term` free-text search |

## Response shape

OData collection responses use `@`-annotated envelope keys:

```json
{
  "@odata.context": "https://api.example.com/$metadata#Products",
  "@odata.count": 100,
  "@odata.nextLink": "https://api.example.com/Products?$count=true&$top=10&$skip=30",
  "value": [{ "id": 21, "name": "Keyboard" }]
}
```

The body carries no current-page or page-size field, so `OdataResponseStrategy` **derives** them from the `@odata.nextLink` URL:

- `perPage` comes from the link's `$top` param (falling back to the item count of the current — necessarily full — page).
- `currentPage` is `$skip ÷ perPage` — the next page starts where the current one ends.
- `lastPage` is `ceil(total ÷ perPage)`.

Without a usable link — the last page, or `$skiptoken`-based server-driven paging — the strategy falls back to page **1**, which is only guaranteed correct for single-page results. Relative `nextLink` values (permitted by the spec) are handled.

:::warning
The envelope keys contain **literal dots** (`@odata.count`), so they are read with flat bracket access — dot-notation paths into nested objects are not supported by this driver's response options.
:::

Key paths are configurable for servers that rename the envelope:

```typescript
provideQubee({
  driver: ODATA_DRIVER,
  response: {
    data: 'items',
    nextPageUrl: 'nextLink',
    total: 'totalCount'
  }
});
```

Defaults are encoded in `OdataResponseOptions`.
