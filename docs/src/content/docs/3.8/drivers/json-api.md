---
slug: 3.8/drivers/json-api
title: "JSON:API Driver"
sidebar:
  label: "JSON:API"
---

Targets any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir, …).

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.JSON_API })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters | `filter[status]=active` |
| Per-type fields | `fields[articles]=title,body&fields[people]=name` |
| Includes | `include=author,comments.author` |
| Sort | `sort=-created_at,name` (`-` = DESC) |
| Pagination | `page[number]=1&page[size]=15` |

## Supported features

`addFilter`, `addFields`, `addIncludes`, `addSort`, `setLimit`, `setPage` and their delete counterparts.

## Unsupported features

- `addFilterOperator` / `deleteOperatorFilters` → `UnsupportedFilterOperatorError`
- `addSelect` / `deleteSelect` → `UnsupportedSelectError` (use `addFields` for column projection)
- `setSearch` / `deleteSearch` → `UnsupportedSearchError`

## Response shape

```json
{
  "data": [...],
  "meta": {
    "current-page": 1,
    "per-page": 10,
    "total": 100,
    "page-count": 10,
    "from": 1,
    "to": 10
  },
  "links": {
    "first": "url",
    "prev": "url",
    "next": "url",
    "last": "url"
  }
}
```

Default key paths are configured in `JsonApiResponseOptions`. Override via `provideNgQubee({ driver: DriverEnum.JSON_API, response: { /* … */ } })`.
