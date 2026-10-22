---
title: The query builder
description: QubeeQueryBuilder — the core query builder as an Angular service, with its state, URI and pagination flags as signals.
---

`QubeeQueryBuilder` is the core's `QueryBuilder` as an injectable. It adds what the core deliberately leaves to adapters — reactivity: every read is a `Signal`, so templates, `computed()`, `effect()` and `httpResource()` follow the query without glue code.

> What each method emits for each driver, which drivers support it, and the rules behind it — which calls reset the page, how values are encoded, what collides — are core behaviour: see [Building a query ↗](https://qubeejs.andreatantimonaco.me/guide/building-a-query/) and [Filters and operators ↗](https://qubeejs.andreatantimonaco.me/guide/filters/). This page covers the Angular service.

## Two kinds of members

- **Mutators** — `setResource()`, `addFilter()`, `nextPage()`, … — write to the shared [`QubeeSignalStore`](/api/services/qubee-signal-store/) and return `this` for chaining. They throw the core's `Unsupported*Error` when the active driver lacks the capability, at the call, not later.
- **Readers** — `uri`, `state`, `currentPage`, `hasNextPage`, … — are computed signals. You read them by calling them, `qb.hasNextPage()`, which is how the 3.x methods were called; they now re-evaluate only when the state changes.

```typescript
import { Component, inject } from '@angular/core';
import { QubeeQueryBuilder, SortEnum } from '@qubeejs/angular';

@Component({
  template: `
    <button [disabled]="qb.isFirstPage()" (click)="qb.previousPage()">Prev</button>
    <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
    <button [disabled]="qb.isLastPage()" (click)="qb.nextPage()">Next</button>
  `
})
export class UsersComponent {
  protected readonly qb = inject(QubeeQueryBuilder);

  constructor() {
    this.qb.setResource('users').addSort('created_at', SortEnum.DESC);
  }
}
```

## Which instance you get

`provideQubee()` registers `QubeeQueryBuilder` at the **environment injector**, so by default every component that injects it shares one query state. That suits an application with one list on screen at a time. Anything else — two lists side by side, a reusable table, a component that binds `httpResource()` to `uri()` — wants its own instance: see [Per-component instances](/guide/per-component-instances/).

## Mutators

All of them return `this`. The middle column names what the call sets; the core docs give the wire format per driver.

| Method | Sets |
| --- | --- |
| `setResource(name)` | The resource, the URI's first path segment. Required before a URI can be built. |
| `setBaseUrl(url)` | A prefix for every URI. Usually configured once as `baseUrl` instead — see below. |
| `setLimit(n)` / `setPage(n)` | Page size and page. |
| `addFilter(field, ...values)` / `deleteFilters(...fields)` | Equality filters; several values merge per field. |
| `addFilterOperator(field, operator, ...values)` / `deleteOperatorFilters(...fields)` | Filters with an explicit `FilterOperatorEnum` operator. |
| `addSort(field, order)` / `deleteSorts(...fields)` | Sort rules, in order. |
| `addSelect(...fields)` / `deleteSelect(...fields)` | Flat field selection. |
| `addFields(model, fields)` / `deleteFields(fields)` / `deleteFieldsByModel(model, ...fields)` | Per-model field selection (JSON:API, Spatie). |
| `addIncludes(...models)` / `deleteIncludes(...models)` | Related resources to include. |
| `addEmbedded(relation, ...columns)` / `deleteEmbedded(...relations)` | Embedded relations (PostgREST, OData, Directus). |
| `setSearch(term)` / `deleteSearch()` | A full-text search term. |
| `setParam(key, ...values)` / `deleteParams(...keys)` | Parameters no driver models, appended after the driver's own on every driver. |
| `nextPage()`, `previousPage()`, `firstPage()`, `lastPage()`, `goToPage(n)` | Page navigation — see [Pagination](/guide/pagination/#moving-between-pages). |
| `reset()` | Everything back to the defaults, base URL included. |

Filter values and search terms are percent-encoded for you: pass raw user input, and never call `encodeURIComponent()` on it yourself.

The full signatures, with the error each one throws, are in the [`QubeeQueryBuilder` reference](/api/services/qubee-query-builder/).

## Readers

| Signal | Type | Value |
| --- | --- | --- |
| `uri` | `Signal<string \| undefined>` | The URI for the current state; `undefined` until a resource is set |
| `state` | `Signal<QueryBuilderState>` | The whole state, deeply frozen |
| `currentPage` | `Signal<number>` | The current page |
| `totalPages` | `Signal<number \| undefined>` | The last page a response reported; `undefined` until one has been parsed |
| `isFirstPage`, `isLastPage`, `hasNextPage`, `hasPreviousPage` | `Signal<boolean>` | Page predicates, safe to bind before the first response |
| `paginationHeaders` | `Signal<Record<string, string> \| null>` | Request headers the driver pages with, or `null` |

The pagination signals are covered in [Pagination](/guide/pagination/#page-signals).

### `uri`

The URI as a computed signal, recomputed on every state change:

```typescript
qb.uri();                                           // string | undefined
effect(() => console.log(qb.uri()));                // logs on every mutation
users = httpResource<RawResponse>(() => qb.uri());  // re-fetches on every mutation
```

It is `undefined` until `setResource()` has been called — the value `httpResource()` treats as "idle" — and otherwise always equals `generateUri()`, including throwing when the state is invalid for the active driver (`UnselectableModelError`, `ParamCollisionError`). [Fetching data](/guide/fetching-data/#with-the-query-builder) builds on it.

### `generateUri()`

The same URI, synchronously, as a plain `string` — for imperative code that fetches on demand:

```typescript
const uri = qb.generateUri();
```

It throws when the resource is unset, or when the state cannot be built for the active driver.

### `state`

The complete query-builder state, as `Signal<QueryBuilderState>`. The snapshot is deeply frozen by the core: read it freely, mutate it never — an attempt throws in strict mode instead of corrupting later reads.

```typescript
const filters = computed(() => qb.state().filters);
```

## The base URL

Configure it once and every instance starts from it:

```typescript
provideQubee({ baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER });
```

`setBaseUrl()` overrides it for one instance; `reset()` clears it, as it clears everything else. Exactly one slash joins it to the resource, whatever trailing or leading slashes either carries.

## Errors

The mutators throw the core's errors, synchronously, at the call that asks for something the driver cannot do — `UnsupportedFilterError`, `UnsupportedSortError`, `InvalidLimitError`, `InvalidPageNumberError` and the rest. Each carries a machine-readable `code`, so you can branch on it without matching message text. They are documented in [Errors ↗](https://qubeejs.andreatantimonaco.me/guide/errors/).
