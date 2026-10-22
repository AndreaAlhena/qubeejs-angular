---
slug: 3.8/drivers/spring
title: "Spring Data REST Driver"
sidebar:
  label: "Spring Data REST"
---

Targets [Spring Data REST](https://spring.io/projects/spring-data-rest) — the standard pagination and sorting convention in the Java / Spring Boot ecosystem, with HAL (Hypertext Application Language) responses.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.SPRING })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Sort | `sort=field,asc&sort=other,desc` (repeatable param, one per rule) |
| Pagination | `page=N&size=N` — **`page` is 0-indexed on the wire** |

:::note[0-indexed pages]
Spring's `page` request parameter counts from 0, while `ng-qubee`'s state (and every other driver) counts from 1. The driver converts at the boundary: `setPage(1)` emits `page=0`, and the response strategy adds 1 back when reading `page.number`. You always work 1-indexed — `firstPage()`, `nextPage()`, `goToPage(n)` behave exactly as on other drivers.
:::

```typescript
qb.setResource('users')
  .addSort('lastName', SortEnum.ASC)
  .addSort('createdAt', SortEnum.DESC)
  .setLimit(20)
  .setPage(2);

// → /users?sort=lastName,asc&sort=createdAt,desc&page=1&size=20
```

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addSort` / `deleteSorts` | ✓ | Repeatable `sort=field,dir` params, lowercase direction |
| `setLimit` / `setPage` | ✓ | Emitted as `size` + 0-indexed `page` |
| `addFilter` / `deleteFilters` | ✗ | No standard filter convention — Spring expects custom query methods / Specifications server-side |
| `addFilterOperator` / `deleteOperatorFilters` | ✗ | Same as above |
| `addSelect` / `deleteSelect` | ✗ | No standard projection parameter (Spring's `projection` is excerpt-based, not a column list) |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | Associations are navigated via HAL links, not query params |
| `addEmbedded` / `deleteEmbedded` | ✗ | PostgREST-only — throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No standard search parameter |

## Response shape (HAL)

```json
{
  "_embedded": {
    "users": [
      { "id": 1, "name": "John" }
    ]
  },
  "_links": {
    "first": { "href": "http://api.example.com/users?page=0&size=20" },
    "prev": { "href": "http://api.example.com/users?page=0&size=20" },
    "next": { "href": "http://api.example.com/users?page=2&size=20" },
    "last": { "href": "http://api.example.com/users?page=4&size=20" }
  },
  "page": {
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "number": 1
  }
}
```

`SpringResponseStrategy` reads `page.{size,totalElements,totalPages,number}` (converting the 0-indexed `number` to a 1-indexed `page`), pulls navigation URLs from `_links.*.href`, and computes `from`/`to` from page × size.

### The `_embedded` rel name

HAL nests the collection under the resource's rel name — `_embedded.users`, `_embedded.articles` — which the library cannot know statically. By default the strategy looks at `_embedded` and picks the **first array** inside it, which is correct for every standard listing endpoint (Spring emits exactly one collection rel). If your payload carries multiple embedded rels, pin the exact path:

```typescript
provideNgQubee({
  driver: DriverEnum.SPRING,
  response: {
    data: '_embedded.users'
  }
});
```

When `_embedded` is absent (Spring omits it on empty result sets), `data` resolves to an empty array.

## Customising response paths

```typescript
provideNgQubee({
  driver: DriverEnum.SPRING,
  response: {
    total: 'page.totalElements',
    nextPageUrl: '_links.next.href'
  }
});
```

Defaults are encoded in `SpringResponseOptions`.
