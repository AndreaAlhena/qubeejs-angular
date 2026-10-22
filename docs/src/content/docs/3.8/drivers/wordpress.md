---
slug: 3.8/drivers/wordpress
title: "WordPress REST Driver"
sidebar:
  label: "WordPress REST"
---

Targets the [WordPress REST API](https://developer.wordpress.org/rest-api/) — the JSON API shipped with every WordPress install since 4.7, with its collection parameters and header-carried pagination metadata.

## Configure

```typescript
import { DriverEnum, provideNgQubee } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.WORDPRESS })]
});
```

Point `setBaseUrl` at the REST root (e.g. `https://example.com/wp-json/wp/v2`) and use the collection name (`posts`, `pages`, `media`, …) as the resource.

## Wire format

| Concern | Output |
|---|---|
| Filters (single value) | `field=value` (collection params: `status=publish`, `author=1`) |
| Filters (multi-value) | `field=v1,v2` (CSV — the WordPress list convention) |
| Sort | `orderby=field&order=asc\|desc` (**single** sort — see below) |
| Select | `_fields=id,title` (CSV) |
| Includes | `_embed=author,wp:term` (CSV) |
| Search | `search=term` |
| Pagination | `page=N&per_page=M` |

The `page` / `per_page` / `orderby` / `order` / `search` keys and the underscore-prefixed global params (`_fields`, `_embed`) are fixed by the server and ignore `request` key overrides.

Two WordPress-specific constraints to keep in mind:

- **Single sort**: WordPress core accepts one `orderby` value, so only the **first** sort rule in state is emitted; additional `addSort` calls are ignored on the wire.
- **`per_page` cap**: the server rejects `per_page > 100` with a `rest_invalid_param` 400. The driver keeps the standard positive-integer validation and leaves the cap to the server — stay at `setLimit(100)` or below.

## Operator filters

WordPress has no generic comparison-operator syntax — only parameter-specific helpers (`before` / `after` for dates, `slug`, `include` / `exclude` ID lists), which pass through `addFilter` as ordinary collection params:

```typescript
qb.addFilter('after', '2024-01-01T00:00:00');   // after=2024-01-01T00:00:00
qb.addFilter('exclude', 12, 13);                 // exclude=12,13
```

`addFilterOperator` therefore throws `UnsupportedFilterOperatorError` for every operator (the `operatorFilters` capability is off).

## Feature matrix

| Method | Supported? | Notes |
|---|---|---|
| `addFilter` / `deleteFilters` | ✓ | Bare collection params, CSV for multi-value |
| `addFilterOperator` / `deleteOperatorFilters` | ✗ | No generic operator syntax |
| `addSort` / `deleteSorts` | ✓ | `orderby` + `order` — first sort rule only |
| `setLimit` / `setPage` | ✓ | `page` + `per_page` (server caps `per_page` at 100) |
| `addSelect` / `deleteSelect` | ✓ | `_fields=` CSV |
| `addFields` / `deleteFields` / `deleteFieldsByModel` | ✗ | No per-model field selection |
| `addIncludes` / `deleteIncludes` | ✓ | `_embed=` CSV (embeds linked resources into `_embedded`) |
| `addEmbedded` / `deleteEmbedded` | ✗ | Throws `UnsupportedEmbeddedError` |
| `setSearch` / `deleteSearch` | ✓ | `search=term` full-text search |

## Response shape

WordPress returns a **bare array body**; pagination metadata travels in HTTP response headers:

```
X-WP-Total: 48
X-WP-TotalPages: 5
Link: <https://example.com/wp-json/wp/v2/posts?page=2>; rel="next"
```

Pass the headers to `paginate()` — the same call-site shape as the PostgREST driver:

```typescript
this._http.get<IPost[]>(uri, { observe: 'response' }).subscribe(response => {
  const collection = this._pagination.paginate(response.body, response.headers);
});
```

`WordpressResponseStrategy` maps `X-WP-Total → total` and `X-WP-TotalPages → lastPage`, surfaces the `Link` URLs as `nextPageUrl` / `prevPageUrl`, and derives position from them:

- `page` is the `prev` link's `page` param + 1 (no `prev` → page 1), falling back to the `next` link's `page` param − 1.
- `perPage` is the item count of any page that has a `next` successor (such a page is necessarily full); on the last page of a multi-page set it stays `undefined`.
- `from`/`to` derive from `page` × `perPage` on full pages, or count back from the total on the last page (`from = total - data.length + 1`, `to = total`).

Headers are optional at the call site — without them the collection still carries the array body, with `undefined` totals. The bag accepts Angular's `HttpHeaders`, the native `Headers` class, or a plain `Record<string, string>`.

Because all metadata is header-borne, this driver uses the plain `ResponseOptions` defaults; only `response.data` matters, and only when your HTTP layer wraps the array in an envelope.
