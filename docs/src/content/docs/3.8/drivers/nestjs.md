---
slug: 3.8/drivers/nestjs
title: "NestJS Driver"
sidebar:
  label: "NestJS"
---

Targets [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate).

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.NESTJS })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Simple filters | `filter.field=value` |
| Operator filters | `filter.field=$operator:value` |
| Sort | `sortBy=field:ASC,field2:DESC` |
| Flat select | `select=col1,col2` |
| Search | `search=term` |
| Pagination | `limit=15&page=1` |

## Supported features

`addFilter`, `addFilterOperator`, `addSelect`, `addSort`, `setSearch`, `setLimit`, `setPage` and their delete counterparts.

## Operator filters

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);     // filter.age=$gte:18
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);  // filter.id=$in:1,2,3
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 100); // filter.price=$btw:10,100
```

Twelve operators: `EQ`, `NOT`, `NULL`, `IN`, `GT`, `GTE`, `LT`, `LTE`, `BTW`, `ILIKE`, `SW`, `CONTAINS`. The four `*FTS` variants are PostgREST-only and throw `UnsupportedFilterOperatorError` here.

## Fetch all

`setLimit(-1)` is accepted on the NestJS driver and honours `nestjs-paginate`'s convention for fetching all records in one response (server must opt in via `maxLimit: -1`):

```typescript
qb.setLimit(-1);  // emits limit=-1
```

This is the only driver where `-1` is valid — the others throw `InvalidLimitError`.

## Unsupported features

- `addFields` / `deleteFields` / `deleteFieldsByModel` → `UnsupportedFieldSelectionError` (use `addSelect` instead)
- `addIncludes` / `deleteIncludes` → `UnsupportedIncludesError`

## Response shape

```json
{
  "data": [...],
  "meta": {
    "currentPage": 1,
    "totalItems": 100,
    "itemsPerPage": 10,
    "totalPages": 10
  },
  "links": {
    "first": "url",
    "previous": "url",
    "next": "url",
    "last": "url",
    "current": "url"
  }
}
```

Default key paths are configured in `NestjsResponseOptions`.
