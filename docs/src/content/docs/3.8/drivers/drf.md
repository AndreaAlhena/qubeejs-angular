---
slug: 3.8/drivers/drf
title: "Django REST Framework Driver"
sidebar:
  label: "Django REST Framework"
---

Targets [Django REST Framework](https://www.django-rest-framework.org/) — the dominant REST API toolkit in the Python ecosystem — paired with [django-filter](https://django-filter.readthedocs.io/) for filtering and `PageNumberPagination` for pagination.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.DRF })]
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` |
| Filters (multi-value) | `field__in=v1,v2,v3` |
| Operator filters | django-filter lookup suffix — see below |
| Ordering | `ordering=-field1,field2` (`-` prefix = DESC) |
| Search | `search=term` (DRF `SearchFilter`) |
| Pagination | `page=N&page_size=M` |

`ordering` and `page_size` are DRF-idiomatic names and are intentionally **not** configurable through `QueryBuilderOptions` (same precedent as PostgREST's `order` / `offset`).

## Operator filters

`FilterOperatorEnum` translates to django-filter's double-underscore lookup convention:

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('price', FilterOperatorEnum.GTE, 100);             // price__gte=100
qb.addFilterOperator('name', FilterOperatorEnum.CONTAINS, 'foo');       // name__contains=foo
qb.addFilterOperator('name', FilterOperatorEnum.ILIKE, 'JOHN');         // name__icontains=JOHN
qb.addFilterOperator('name', FilterOperatorEnum.SW, 'Ja');              // name__startswith=Ja
qb.addFilterOperator('tag', FilterOperatorEnum.IN, 'a', 'b', 'c');      // tag__in=a,b,c
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 100);         // price__range=10,100
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, true);       // deletedAt__isnull=true
qb.addFilterOperator('deletedAt', FilterOperatorEnum.NULL, false);      // deletedAt__isnull=false
```

### Translation table

| `FilterOperatorEnum` | django-filter lookup |
|---|---|
| `EQ` | (no suffix — django-filter's default `exact`) |
| `GT` / `GTE` / `LT` / `LTE` | `__gt` / `__gte` / `__lt` / `__lte` |
| `CONTAINS` | `__contains` |
| `ILIKE` | `__icontains` (case-insensitive contains) |
| `IN` | `__in` (comma-joined values) |
| `SW` | `__startswith` |
| `BTW` | `__range` (arity-checked, comma-joined `[min, max]`) |
| `NULL` (`true`) | `__isnull=true` |
| `NULL` (`false`) | `__isnull=false` |
| `NOT` | **unsupported** — no generic negation in django-filter; use `__exclude` server-side |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — PostgREST-only |

### Value shape rules

Enforced at call time — both throw `InvalidFilterOperatorValueError`:

- `BTW` requires exactly **2 values** (`[min, max]`).
- `NULL` requires exactly **1 boolean value** (`true` → `IS NULL`, `false` → `IS NOT NULL`).

Other operators leave shape validation to the server.

## Combining simple and operator filters

Both forms emit independent query segments, so they coexist freely:

```typescript
qb.addFilter('status', 'active');
qb.addFilterOperator('status', FilterOperatorEnum.NULL, false);
// → status=active&status__isnull=false
```

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Single value → `field=value`; multi-value → `field__in=v1,v2,v3` |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | Emitted as `ordering=-field1,field2` |
| `setSearch` / `deleteSearch` | ✓ | DRF's `SearchFilter` (`search=term`) |
| `setLimit` / `setPage` | ✓ | `page_size` mirrors `limit` |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | DRF has no first-class per-model fields (`django-restql` exists but is not core) |
| `addIncludes` / `deleteIncludes` | ✗ | DRF has no first-class relation includes |
| `addEmbedded` / `deleteEmbedded` | ✗ | PostgREST-only — throws `UnsupportedEmbeddedError` |
| `addSelect` / `deleteSelect` | ✗ | DRF has no flat column-list select |

## Response shape

DRF's `PageNumberPagination` returns:

```json
{
  "count": 100,
  "next": "http://api.example.com/items/?page=3&page_size=10",
  "previous": "http://api.example.com/items/?page=1&page_size=10",
  "results": [
    { "id": 1, "name": "Hello" }
  ]
}
```

The body emits **no `current_page` field**, so `DrfResponseStrategy` derives it by parsing the `previous` URL:

- `previous === null` → current page is **1**.
- `previous` set but with no `?page=N` → current page is **2** (DRF omits `page=1` from URLs when the previous page is the first).
- `previous` contains `?page=N` → current page is **N + 1**.

`perPage` is parsed from `?page_size=N` on the `next` URL first, falling back to `previous`. `lastPage` is then computed as `Math.ceil(count / perPage)`, and `from`/`to` follow from `(currentPage - 1) * perPage + 1` and `min(currentPage * perPage, count)`.

When neither URL carries `?page_size` (e.g. a single-page result that fits the server's default size), `perPage`, `lastPage`, `from`, and `to` are left `undefined` — the body alone is not enough to recover them.

## Customising response paths

```typescript
provideNgQubee({
  driver: DriverEnum.DRF,
  response: {
    data: 'items',          // override 'results'
    total: 'totalCount',    // override 'count'
    nextPageUrl: 'nextLink',
    prevPageUrl: 'prevLink'
  }
});
```

Defaults are encoded in `DrfResponseOptions`. The `currentPage` / `perPage` / `lastPage` / `from` / `to` slots are ignored by the strategy (it derives them from URL parsing instead), so overriding them in `IConfig.response` has no effect.
