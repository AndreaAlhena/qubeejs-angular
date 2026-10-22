---
slug: 3.8/guide/query-builder
title: "Query Builder API"
---

Every fluent method on `NgQubeeService`. All methods that mutate state return `this` for chaining; capability methods return values without mutating.

Driver compatibility is gated at runtime — calling an unsupported method throws an `Unsupported*Error`. The per-driver pages list which methods each driver accepts.

## State setup

### `setResource(name)`

Required before any URI generation. Becomes the first path segment.

```typescript
qb.setResource('users');     // → /users…
```

Triggers an [auto-reset of `page`](#auto-reset-of-page).

### `setBaseUrl(url)`

Optional. Prepends a base URL (e.g. `https://api.example.com`) to every generated URI.

```typescript
qb.setBaseUrl('https://api.example.com');     // → https://api.example.com/users…
```

Does not trigger auto-reset (URL prefix only).

### `setLimit(n)` / `setPage(n)`

Pagination position.

```typescript
qb.setLimit(25).setPage(2);   // 25 items, page 2
```

`setLimit` triggers auto-reset of `page`. `setPage` of course does not. NestJS additionally accepts `setLimit(-1)` as the [fetch-all sentinel](/3.8/drivers/nestjs/#fetch-all). Spring emits `page` [0-indexed on the wire](/3.8/drivers/spring/) — your state stays 1-indexed.

## Filters

### `addFilter(field, ...values)` / `deleteFilters(...fields)`

Simple key-value filters. Multi-value calls merge per field.

```typescript
qb.addFilter('status', 'active');           // single
qb.addFilter('id', 1, 2, 3);                // multi-value
qb.deleteFilters('status');                  // remove
```

Spatie / JSON:API: `filter[status]=active`. NestJS: `filter.status=active`. PostgREST: `status=eq.active` (single) or `status=in.(1,2,3)` (multi). Strapi: `filters[status][$eq]=active`. DRF: `status=active` (single) or `status__in=1,2,3` (multi). @nestjsx/crud: `filter=status||$eq||active` (single) or `filter=status||$in||1,2,3` (multi). Sieve: `filters=status==active` (single) or `filters=status==1|2|3` (multi). OData: `$filter=status eq 'active'` (single) or `$filter=status in (1,2,3)` (multi). Directus: `filter[status][_eq]=active` (single) or `filter[status][_in]=1,2,3` (multi). json-server: `status=active` (single) or `status:in=1,2,3` (multi). API Platform: `status=active` (single) or `status[]=a&status[]=b` (multi); relation dot paths (`author.name=John`) pass through. Feathers: `status=active` (single) or `status[$in][0]=active&status[$in][1]=pending` (multi). PocketBase: `filter=(status='active')` (single) or `filter=((status='active' || status='pending'))` (multi). Payload: `where[status][equals]=active` (single) or `where[status][in]=active,pending` (multi). WordPress: `status=publish` (single) or `categories=2,3` (multi, CSV).

Triggers auto-reset.

### `addFilterOperator(field, operator, ...values)` / `deleteOperatorFilters(...fields)`

Filters with explicit comparison operators. Supported by API Platform, Directus, Feathers, json-server, NestJS, @nestjsx/crud, OData, Payload, PocketBase, PostgREST, Sieve, Strapi, and DRF.

```typescript
import { FilterOperatorEnum } from 'ng-qubee';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);
```

The full operator list: `EQ`, `NOT`, `NULL`, `IN`, `GT`, `GTE`, `LT`, `LTE`, `BTW`, `ILIKE`, `SW`, `CONTAINS`. PostgREST adds `FTS`, `PLFTS`, `PHFTS`, `WFTS`. Per-driver support varies — DRF and API Platform reject `NOT` (no generic negation filter) plus the `FTS` family (PostgREST-only); Strapi, @nestjsx/crud, Sieve, OData, Directus, and PocketBase reject only the `FTS` family; json-server additionally rejects `ILIKE` (no case-insensitive variant) and `NULL` (no null-check operator); Feathers rejects `CONTAINS`/`ILIKE`/`SW` (LIKE-style matching is adapter-specific, not part of the common syntax) and `NULL` on top of the `FTS` family; Payload rejects `SW` (no starts-with operator) plus the `FTS` family. See each driver's page for detailed mappings: [API Platform](/3.8/drivers/api-platform/#operator-filters), [Directus](/3.8/drivers/directus/#operator-filters), [Feathers](/3.8/drivers/feathers/#operator-filters), [json-server](/3.8/drivers/json-server/#operator-filters), [NestJS](/3.8/drivers/nestjs/#operator-filters), [@nestjsx/crud](/3.8/drivers/nestjsx-crud/#operator-filters), [OData](/3.8/drivers/odata/#operator-filters), [Payload](/3.8/drivers/payload/#operator-filters), [PocketBase](/3.8/drivers/pocketbase/#operator-filters), [PostgREST](/3.8/drivers/postgrest/#operator-filters), [Sieve](/3.8/drivers/sieve/#operator-filters), [Strapi](/3.8/drivers/strapi/#operator-filters), [DRF](/3.8/drivers/drf/#operator-filters).

Triggers auto-reset.

## Sorting

### `addSort(field, order)` / `deleteSorts(...fields)`

```typescript
import { SortEnum } from 'ng-qubee';

qb.addSort('created_at', SortEnum.DESC);
qb.addSort('name', SortEnum.ASC);
qb.deleteSorts('created_at');
```

Spatie / JSON:API: `sort=-created_at,name`. NestJS: `sortBy=created_at:DESC,name:ASC`. PostgREST: `order=created_at.desc,name.asc`. Strapi: `sort[0]=created_at:desc&sort[1]=name:asc`. DRF: `ordering=-created_at,name`. @nestjsx/crud: `sort=created_at,DESC&sort=name,ASC`. Spring: `sort=created_at,desc&sort=name,asc`. Sieve: `sorts=-created_at,name`. OData: `$orderby=created_at desc,name asc`. Directus: `sort=-created_at,name`. json-server: `_sort=-created_at,name`. API Platform: `order[created_at]=desc&order[name]=asc`. Feathers: `$sort[created_at]=-1&$sort[name]=1`. PocketBase: `sort=-created_at,name`. Payload: `sort=-created_at,name`. WordPress: `orderby=created_at&order=desc` (single sort only — the first rule wins).

Triggers auto-reset.

## Column selection

### `addSelect(...fields)` / `deleteSelect(...fields)` — Directus / Feathers / NestJS / @nestjsx/crud / OData / Payload / PocketBase / PostgREST / Strapi / WordPress

Flat column list:

```typescript
qb.addSelect('id', 'email', 'name');     // select=id,email,name
```

Does **not** trigger auto-reset (column shape change, not record-set change).

### `addFields(model, fields)` / `deleteFields({ model: [...] })` / `deleteFieldsByModel(model, ...fields)` — JSON:API / Spatie

Per-model selection:

```typescript
qb.addFields('users', ['id', 'email']);                      // fields[users]=id,email
qb.deleteFields({ users: ['email'] });
qb.deleteFieldsByModel('users', 'email');
```

Does **not** trigger auto-reset.

## Includes — JSON:API / Spatie / Strapi / @nestjsx/crud / OData / Directus / PocketBase / WordPress

### `addIncludes(...models)` / `deleteIncludes(...models)`

```typescript
qb.addIncludes('profile', 'posts');     // include=profile,posts
qb.deleteIncludes('profile');
```

Does **not** trigger auto-reset (related-resource shape, not record set).

## Embedded resources — PostgREST / OData / Directus

### `addEmbedded(relation, ...columns)` / `deleteEmbedded(...relations)`

PostgREST's idiomatic join mechanism: related-table columns are spliced into the single `select=` query parameter, alongside any flat columns from `addSelect`.

```typescript
qb.addEmbedded('author', 'id', 'name')   // author(id,name)
  .addEmbedded('comments')               // comments(*) — no columns = all columns
  .addSelect('title');
// → select=title,author(id,name),comments(*)

qb.deleteEmbedded('comments');           // removes the whole relation entry
```

With embedded relations but no `addSelect`, the flat part defaults to `*` so the base row's columns stay in the projection. Repeated calls for the same relation merge-dedup the columns. On OData, embedded relations emit as `$expand=rel($select=col1,col2)` inline projections instead; on Directus, as `rel.col` dot paths inside the `fields=` CSV. Every other driver throws `UnsupportedEmbeddedError` — drivers with a standalone relation parameter expose it through `addIncludes` instead.

Does **not** trigger auto-reset (column shape change, not record set).

## Search — NestJS / DRF / OData / Directus / json-server / WordPress

### `setSearch(term)` / `deleteSearch()`

```typescript
qb.setSearch('john doe');     // search=john doe
qb.deleteSearch();
```

Triggers auto-reset.

## Auto-reset of `page`

Several mutations reset `state.page` to `1` automatically because they invalidate the current page position:

- `setLimit` (page count changes)
- `setResource` (different record set)
- `setSearch` / `deleteSearch` (different record set)
- `addFilter` / `deleteFilters` (different record set)
- `addFilterOperator` / `deleteOperatorFilters` (different record set)
- `addSort` / `deleteSorts` (different ordering)

Methods that change record *shape* (`addFields`, `addIncludes`, `addSelect`, `setBaseUrl`) leave `page` untouched.

## Lifecycle

### `generateUri()`

Returns an `Observable<string>` that emits the composed URI:

```typescript
qb.generateUri().subscribe(uri => /* … */);
```

URIs do not auto-emit on state mutations — call `generateUri()` explicitly when you want the next URI.

### `reset()`

Resets state to defaults (clears all filters, sorts, fields, includes, sets `page=1`, `limit=15`):

```typescript
qb.reset();
```

## Pagination navigation

See [Pagination](/3.8/guide/pagination/) for `nextPage`, `previousPage`, `firstPage`, `lastPage`, `goToPage`, `currentPage`, `totalPages`, `isFirstPage`, `isLastPage`, `hasNextPage`, `hasPreviousPage`, `paginationHeaders`.
