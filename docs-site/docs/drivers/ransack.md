---
sidebar_position: 19
title: Ransack (Rails)
---

# Ransack Driver

Targets [Ransack](https://activerecord-hackery.github.io/ransack/) — the search and sort gem for Ruby on Rails — with its `q[attribute_predicate]` condition syntax, paired with the pagination gem that carries the totals in response headers: [Pagy](https://ddnexus.github.io/pagy/) or [Kaminari](https://github.com/kaminari/kaminari) + [api-pagination](https://github.com/davidcelis/api-pagination).

## Configure

```typescript
import { RANSACK_DRIVER, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: RANSACK_DRIVER })]
});
```

Kaminari reads the page size from `per_page` rather than Pagy's `limit`, so rename the parameter once:

```typescript
provideQubee({
  driver: RANSACK_DRIVER,
  request: { limit: 'per_page' }
});
```

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `q[field_eq]=value` |
| Filters (multi-value) | `q[field_in][]=v1&q[field_in][]=v2` (repeated keys) |
| Operator filters | `q[field_predicate]=value` — see below |
| Sort | `q[s][]=created_at+desc&q[s][]=title+asc` (array form, one entry per rule) |
| Pagination | `page=N&limit=M` (Pagy's defaults) |

Every condition nests under the `q` search key, which is fixed and ignores `request` key overrides; `page` and `limit` follow them. Several values travel as repeated `[]` keys because Ransack never splits a comma-separated string — `q[status_in]=a,b` would match the literal `'a,b'`. A simple filter always carries the `_eq` predicate, since Ransack silently ignores an attribute without one.

Two Ransack-specific constraints to keep in mind:

- **Attribute names**: conditions and sorts name the model's own attributes, in snake_case — `created_at`, not `createdAt`. Ransack 4 and later search only what the model allowlists in `ransackable_attributes` (and `ransackable_associations`, for a condition such as `author_name_cont`); a condition or sort on any other attribute is ignored.
- **No global search**: Ransack has no search parameter. A combinator attribute name searches several columns in one condition instead:

```typescript
qb.addFilterOperator('title_or_body', FilterOperatorEnum.ILIKE, 'rails');   // q[title_or_body_i_cont]=rails
```

## Operator filters

`FilterOperatorEnum` translates to Ransack predicates:

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('views', FilterOperatorEnum.GTE, 100);              // q[views_gteq]=100
qb.addFilterOperator('title', FilterOperatorEnum.ILIKE, 'rails');        // q[title_i_cont]=rails
qb.addFilterOperator('title', FilterOperatorEnum.SW, 'rai');             // q[title_start]=rai
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);              // q[id_in][]=1&q[id_in][]=2&q[id_in][]=3
qb.addFilterOperator('status', FilterOperatorEnum.NOT, 'draft');         // q[status_not_eq]=draft
qb.addFilterOperator('price', FilterOperatorEnum.BTW, 10, 50);           // q[price_gteq]=10&q[price_lteq]=50
qb.addFilterOperator('deleted_at', FilterOperatorEnum.NULL, true);       // q[deleted_at_null]=1
```

### Translation table

| `FilterOperatorEnum` | Ransack predicate |
|---|---|
| `EQ` | `_eq` |
| `GT` / `GTE` / `LT` / `LTE` | `_gt` / `_gteq` / `_lt` / `_lteq` |
| `CONTAINS` | `_cont` (case-sensitive on PostgreSQL since Ransack 6.0) |
| `ILIKE` | `_i_cont` (case-insensitive, built in since Ransack 2.4) |
| `SW` | `_start` |
| `IN` | `_in[]` (repeated keys) |
| `BTW` | `_gteq` + `_lteq` pair (arity-checked) |
| `NOT` (single) | `_not_eq` |
| `NOT` (multi) | `_not_in[]` (repeated keys) |
| `NULL` | `true` → `_null=1` (IS NULL), `false` → `_not_null=1` (IS NOT NULL); arity/type-checked |
| `FTS` / `PHFTS` / `PLFTS` / `WFTS` | **unsupported** — throws `UnsupportedFilterOperatorError` |

### Value shape rules

`BTW` requires exactly **2 values** (`min`, `max`); `NULL` requires exactly **1 boolean** — both enforced at call time with `InvalidFilterOperatorValueError`. Other operators leave shape validation to the server.

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | `_eq` (single) or repeated `_in[]` (multi) under `q` |
| `addFilterOperator` / `deleteOperatorFilters` | ✓ | See translation table above |
| `addSort` / `deleteSorts` | ✓ | `q[s][]=field+asc\|desc`, one entry per rule |
| `setLimit` / `setPage` | ✓ | `page` + `limit` (`request: { limit: 'per_page' }` for Kaminari) |
| `addSelect` / `deleteSelect` | ✗ | No field selection |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✗ | No includes |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✗ | No global search — use a combinator attribute name (`title_or_body`) with an operator filter |

## Response shape

Ransack filters and sorts; the pagination gem shapes the response. The body is a **bare array**, and the metadata travels in HTTP response headers:

```
total-count: 48
total-pages: 24
current-page: 2
page-limit: 2
link: <https://api.example.com/articles?page=1>; rel="prev", <https://api.example.com/articles?page=3>; rel="next"
```

Pass the headers to `paginate()` — the same call-site shape as the PostgREST and WordPress drivers:

```typescript
private readonly _response = httpResource<Article[]>(() => this._qb.uri());

constructor() {
  effect(() => {
    if (this._response.hasValue()) {
      this._page.set(this._pagination.paginate<Article>(this._response.value(), this._response.headers()));
    }
  });
}
```

`RansackResponseStrategy` reads both common gems without configuration:

| | Pagy | Kaminari + api-pagination |
|---|---|---|
| Page-size param | `limit` (the default) | `per_page` |
| Headers read | `total-count`, `total-pages`, `current-page`, `page-limit`, `link` | `total`, `per-page`, `link` |
| Last page | `total-pages` | the `rel="last"` link, else total ÷ page size |

Navigation URLs come from the `link` header (`first`, `prev` — also `rel="previous"`, as Pagy sent before 43.7 — `next`, `last`) and surface as `firstPageUrl` / `prevPageUrl` / `nextPageUrl` / `lastPageUrl`. Whatever no header names is derived:

- `page` is the `prev` link's `page` param + 1, else the `next` link's − 1, else 1.
- `perPage` is the row count, whenever a `next` link proves the page full.
- `lastPage` is the `last` link's `page` param, else total ÷ page size rounded up.
- `from`/`to` derive from the page and page size, or count back from the total on the last page; both stay `undefined` on an empty page.

Headers are optional at the call site — without them the collection still carries the array body, with `undefined` totals. The bag accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>`; a plain object must use the header names' lower-case spelling, as Rack 3 and HTTP/2 send them.

A header renamed on the server is renamed here through `response` — the configured name is read first, then api-pagination's:

```typescript
provideQubee({
  driver: RANSACK_DRIVER,
  response: { total: 'x-total' }
});
```

Pagy ignores a client-supplied `limit` unless the server sets its `client_limit` option, and Kaminari on its own sends no headers at all — pair it with api-pagination. Defaults are encoded in `RansackResponseOptions`.

:::caution Cross-origin headers
Cross-origin, the browser hides these headers from your code unless the server exposes them. With rack-cors, in the `allow` block:

```ruby
resource '*', headers: :any, methods: [:get],
  expose: %w[link total-count total-pages current-page page-limit]
```

For api-pagination, expose `link`, `total` and `per-page` instead.
:::
