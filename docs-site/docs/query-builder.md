---
sidebar_position: 3
title: Query Builder API
---

# Query Builder API

Every fluent method on `QubeeQueryBuilder`. Mutators return `this` for chaining. Readers — the URI, the state and the pagination flags — are computed signals, covered under [Lifecycle](#lifecycle) below and in [Pagination](./pagination.md).

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

`setLimit` triggers auto-reset of `page`. `setPage` of course does not. NestJS additionally accepts `setLimit(-1)` as the [fetch-all sentinel](./drivers/nestjs.md#fetch-all). Spring emits `page` [0-indexed on the wire](./drivers/spring.md) — your state stays 1-indexed.

## Filters

### `addFilter(field, ...values)` / `deleteFilters(...fields)`

Simple key-value filters. Multi-value calls merge per field.

```typescript
qb.addFilter('status', 'active');           // single
qb.addFilter('id', 1, 2, 3);                // multi-value
qb.deleteFilters('status');                  // remove
```

Spatie / JSON:API: `filter[status]=active`. NestJS: `filter.status=active`. PostgREST: `status=eq.active` (single) or `status=in.(1,2,3)` (multi). Strapi: `filters[status][$eq]=active`. DRF: `status=active` (single) or `status__in=1,2,3` (multi). @nestjsx/crud: `filter=status||$eq||active` (single) or `filter=status||$in||1,2,3` (multi). Sieve: `filters=status==active` (single) or `filters=status==1|2|3` (multi). OData: `$filter=status eq 'active'` (single) or `$filter=status in (1,2,3)` (multi). Directus: `filter[status][_eq]=active` (single) or `filter[status][_in]=1,2,3` (multi). json-server: `status=active` (single) or `status:in=1,2,3` (multi). API Platform: `status=active` (single) or `status[]=a&status[]=b` (multi); relation dot paths (`author.name=John`) pass through. Feathers: `status=active` (single) or `status[$in][0]=active&status[$in][1]=pending` (multi). PocketBase: `filter=(status='active')` (single) or `filter=((status='active' || status='pending'))` (multi). Payload: `where[status][equals]=active` (single) or `where[status][in]=active,pending` (multi). WordPress: `status=publish` (single) or `categories=2,3` (multi, CSV).

Filter values are percent-encoded, so a `&` or `#` typed by a user stays inside its value — pass raw input, and don't call `encodeURIComponent()` yourself.

Triggers auto-reset.

### `addFilterOperator(field, operator, ...values)` / `deleteOperatorFilters(...fields)`

Filters with explicit comparison operators. Supported by API Platform, Directus, Feathers, json-server, NestJS, @nestjsx/crud, OData, Payload, PocketBase, PostgREST, Sieve, Strapi, and DRF.

```typescript
import { FilterOperatorEnum } from '@qubeejs/angular';

qb.addFilterOperator('age', FilterOperatorEnum.GTE, 18);
qb.addFilterOperator('id', FilterOperatorEnum.IN, 1, 2, 3);
```

The full operator list: `EQ`, `NOT`, `NULL`, `IN`, `GT`, `GTE`, `LT`, `LTE`, `BTW`, `ILIKE`, `SW`, `CONTAINS`. PostgREST adds `FTS`, `PLFTS`, `PHFTS`, `WFTS`. Per-driver support varies — DRF and API Platform reject `NOT` (no generic negation filter) plus the `FTS` family (PostgREST-only); Strapi, @nestjsx/crud, Sieve, OData, Directus, and PocketBase reject only the `FTS` family; json-server additionally rejects `ILIKE` (no case-insensitive variant) and `NULL` (no null-check operator); Feathers rejects `CONTAINS`/`ILIKE`/`SW` (LIKE-style matching is adapter-specific, not part of the common syntax) and `NULL` on top of the `FTS` family; Payload rejects `SW` (no starts-with operator) plus the `FTS` family. See each driver's page for detailed mappings: [API Platform](./drivers/api-platform.md#operator-filters), [Directus](./drivers/directus.md#operator-filters), [Feathers](./drivers/feathers.md#operator-filters), [json-server](./drivers/json-server.md#operator-filters), [NestJS](./drivers/nestjs.md#operator-filters), [@nestjsx/crud](./drivers/nestjsx-crud.md#operator-filters), [OData](./drivers/odata.md#operator-filters), [Payload](./drivers/payload.md#operator-filters), [PocketBase](./drivers/pocketbase.md#operator-filters), [PostgREST](./drivers/postgrest.md#operator-filters), [Sieve](./drivers/sieve.md#operator-filters), [Strapi](./drivers/strapi.md#operator-filters), [DRF](./drivers/drf.md#operator-filters).

Triggers auto-reset.

## Sorting

### `addSort(field, order)` / `deleteSorts(...fields)`

```typescript
import { SortEnum } from '@qubeejs/angular';

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

## Extra parameters — all drivers

### `setParam(key, ...values)` / `deleteParams(...keys)`

For what a backend accepts beyond the driver's own parameters — a top-level `status`, an `include` on a driver without includes. Params are appended after the driver's, so they work with every driver and are not gated by its capabilities:

```typescript
qb.setParam('status', 'failed');   // Spatie → /users?limit=15&page=1&status=failed
qb.setParam('ids', 'a,b', 'c');    // ids=a%2Cb,c
qb.deleteParams('status', 'ids');
```

The key is emitted verbatim — never build one from user input — and each value is percent-encoded, then joined with a literal `,`. Setting a key again replaces its values. A key that collides with one the driver emits (`page` on Spatie, `page` against JSON:API's `page[number]`) makes `generateUri()` and `uri()` throw `ParamCollisionError` rather than send a duplicate.

Triggers auto-reset.

## Auto-reset of `page`

Several mutations reset `state.page` to `1` automatically because they invalidate the current page position:

- `setLimit` (page count changes)
- `setResource` (different record set)
- `setSearch` / `deleteSearch` (different record set)
- `addFilter` / `deleteFilters` (different record set)
- `addFilterOperator` / `deleteOperatorFilters` (different record set)
- `addSort` / `deleteSorts` (different ordering)
- `setParam` / `deleteParams` (different record set)

Methods that change record *shape* (`addFields`, `addIncludes`, `addSelect`, `setBaseUrl`) leave `page` untouched.

## Lifecycle

### `generateUri()`

Returns the composed URI, synchronously, as a `string`:

```typescript
const uri = qb.generateUri();
```

Throws when the state cannot be built for the active driver — most commonly before `setResource()` has been called, or `UnselectableModelError` when `addFields` names a model that is neither the resource nor included.

### `uri`

The same URI as a computed signal, re-evaluated on every state change:

```typescript
qb.uri();                                          // string | undefined
effect(() => console.log(qb.uri()));                // logs on every mutation
users = httpResource<RawResponse>(() => qb.uri()); // re-fetches on every mutation
```

`uri()` is `undefined` until a resource is set — the idle sentinel `httpResource()` understands — and otherwise equals `generateUri()`, including the throw on an invalid state. See [Fetching data](./fetching-data.md).

### `state`

The complete query-builder state as a signal, `Signal<QueryBuilderState>`. The snapshot is deeply frozen: read it freely, mutate it never.

### `reset()`

Resets state to defaults (clears all filters, sorts, fields, includes, sets `page=1`, `limit=15`):

```typescript
qb.reset();
```

## Pagination navigation

See [Pagination](./pagination.md) for the navigation helpers `nextPage`, `previousPage`, `firstPage`, `lastPage`, `goToPage`, and the signals `currentPage`, `totalPages`, `isFirstPage`, `isLastPage`, `hasNextPage`, `hasPreviousPage`, `paginationHeaders`.
