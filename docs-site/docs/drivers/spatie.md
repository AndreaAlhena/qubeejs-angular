---
sidebar_position: 3
title: Spatie
---

# Spatie Driver

Targets [Spatie Laravel Query Builder](https://spatie.be/docs/laravel-query-builder).

## Configure

```typescript
import { SPATIE_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: SPATIE_DRIVER })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters | `filter[field]=value` |
| Per-model fields | `fields[users]=id,email` |
| Includes | `include=profile,posts` |
| Sort | `sort=-created_at,name` (`-` = DESC) |
| Pagination | `limit=15&page=1` |

## Supported features

`addFilter`, `addFields`, `addIncludes`, `addSort`, `setLimit`, `setPage` and their delete counterparts.

## Unsupported features

- `addFilterOperator` / `deleteOperatorFilters` → `UnsupportedFilterOperatorError`
- `addSelect` / `deleteSelect` → `UnsupportedSelectError`
- `setSearch` / `deleteSearch` → `UnsupportedSearchError`

## Customising request keys

Each query parameter name is configurable via `QubeeConfig.request`:

```typescript
provideQubee({
  driver: SPATIE_DRIVER,
  request: {
    filters: 'custom-filter-key',
    fields: 'custom-fields-key',
    includes: 'custom-includes-key',
    limit: 'per_page',
    page: 'pg',
    sort: 'orderBy'
  }
});
```

Defaults match Spatie's documented conventions.

## Response shape

```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 15,
  "total": 100,
  "from": 1,
  "to": 15,
  "first_page_url": "...",
  "last_page": 7,
  "last_page_url": "...",
  "next_page_url": "...",
  "prev_page_url": null
}
```
